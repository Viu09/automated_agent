"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  fetchAgentConfigs,
  fetchAgents,
  fetchLatestRuns,
  fetchProfile,
  fetchUserPreferences,
  loginUser,
  registerUser,
  saveAgentConfig,
  saveUserPreferences,
  triggerAgent,
} from "@/lib/api";
import type {
  AgentListItem,
  AgentRunRead,
  AuthPayload,
  RegisterPayload,
  UserRead,
} from "@/types/api";
import {
  DayCard,
  FocusCard,
  PersonalAssistantCard,
} from "@/features/dashboard/components/dashboard-panels";
import {
  AuthScreen,
  FooterStatusBar,
  GlobalViewSection,
  HeroHeader,
  ScenarioSection,
  SidebarRail,
} from "@/features/dashboard/components/dashboard-sections";
import { HubAgentCard } from "@/features/dashboard/components/hub-agent-card";
import { CARD_BLUEPRINTS, TOKEN_STORAGE_KEY } from "@/features/dashboard/constants";
import {
  getConnectedCount,
  getPreferredActiveAgent,
  isRealAgentKey,
  mergeDefaultConfig,
  sanitizeConfig,
  tabMatchesCard,
} from "@/features/dashboard/helpers";
import type { AgentConfigMap } from "@/features/dashboard/types";

export function DashboardShell() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserRead | null>(null);
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [runs, setRuns] = useState<AgentRunRead[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfigMap>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string>("weather");
  const [activeTab, setActiveTab] = useState<string>("Tous les agents");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setAgents([]);
      setRuns([]);
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setDashboardError(null);

      try {
        const [profile, agentList, latestRuns] = await Promise.all([
          fetchProfile(token),
          fetchAgents(token),
          fetchLatestRuns(token),
        ]);
        const [persistedConfigs, preferences] = await Promise.all([
          fetchAgentConfigs(token),
          fetchUserPreferences(token),
        ]);

        if (cancelled) {
          return;
        }

        setUser(profile);
        setAgents(agentList);
        setRuns(latestRuns);
        setAgentConfig((current) => mergeDefaultConfig(current, agentList, persistedConfigs));
        setPreferencesLoaded(true);

        const preferredAgent = getPreferredActiveAgent(preferences);
        if (preferredAgent && agentList.some((item) => item.key === preferredAgent)) {
          setActiveAgent(preferredAgent);
        } else if (agentList[0]) {
          setActiveAgent(agentList[0].key);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardError(error instanceof Error ? error.message : "Unable to load dashboard.");
          handleLogout();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !preferencesLoaded || !activeAgent) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveUserPreferences(token, { active_agent: activeAgent });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [activeAgent, preferencesLoaded, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    async function refreshRuns() {
      if (document.visibilityState === "hidden") {
        scheduleNext(45000);
        return;
      }

      try {
        const latestRuns = await fetchLatestRuns(token);
        if (!cancelled) {
          setRuns((current) => {
            const currentSerialized = JSON.stringify(current);
            const nextSerialized = JSON.stringify(latestRuns);
            return currentSerialized === nextSerialized ? current : latestRuns;
          });
        }
      } catch {
        // Keep the previous snapshot if background refresh fails.
      }

      const hasLiveRuns = runs.some((run) => run.status === "running" || run.status === "queued");
      scheduleNext(hasLiveRuns ? 12000 : 30000);
    }

    function scheduleNext(delay: number) {
      timeoutId = window.setTimeout(() => {
        void refreshRuns();
      }, delay);
    }

    scheduleNext(30000);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [runs, token]);

  const now = new Date();
  const operatorName = user?.full_name?.trim() || "Operateur";

  const latestRunMap = useMemo(
    () => Object.fromEntries(runs.map((run) => [run.agent_key, run])),
    [runs],
  );

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.key === activeAgent) ?? agents[0] ?? null,
    [activeAgent, agents],
  );

  const selectedRun = selectedAgent ? latestRunMap[selectedAgent.key] ?? null : null;
  const realAgentKeys = useMemo(() => new Set(agents.map((agent) => agent.key)), [agents]);

  const visibleCards = useMemo(() => {
    return CARD_BLUEPRINTS.filter((card) => {
      const searchMatch =
        searchQuery.trim() === "" ||
        `${card.title} ${card.description} ${card.key}`.toLowerCase().includes(searchQuery.toLowerCase());
      return searchMatch && tabMatchesCard(activeTab, card.key);
    });
  }, [activeTab, searchQuery]);

  const completedRuns = runs.filter((run) => run.status === "completed").length;
  const activeRuns = runs.filter((run) => run.status === "running" || run.status === "queued").length;
  const connectedCardsCount = CARD_BLUEPRINTS.filter((card) => latestRunMap[card.key] || realAgentKeys.has(card.key)).length;

  const domainStatus = {
    productivity: getConnectedCount(["productivity", "project", "agenda"], latestRunMap),
    learning: getConnectedCount(["learning"], latestRunMap),
    finance: getConnectedCount(["finance"], latestRunMap),
    health: getConnectedCount(["health", "weather"], latestRunMap),
    social: getConnectedCount(["social"], latestRunMap),
    creative: getConnectedCount(["creative"], latestRunMap),
  };

  function persistToken(nextToken: string) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
  }

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  }

  function handleConfigChange(agentKey: string, field: string, value: string) {
    setAgentConfig((current) => ({
      ...current,
      [agentKey]: {
        ...current[agentKey],
        [field]: value,
      },
    }));
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: AuthPayload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const response = await loginUser(payload);
      persistToken(response.access_token);
      formElement.reset();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterError(null);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: RegisterPayload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      full_name: String(form.get("full_name") ?? "") || undefined,
    };

    try {
      await registerUser(payload);
      setRegisterError("Compte cree. Vous pouvez maintenant vous connecter.");
      formElement.reset();
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Registration failed.");
    }
  }

  async function handleTrigger(agentKey: string) {
    if (!token) {
      return;
    }

    setDashboardError(null);
    setSaveMessage(null);

    try {
      const cleanConfig = sanitizeConfig(agentConfig[agentKey] ?? {});
      await saveAgentConfig(token, agentKey, cleanConfig);
      await triggerAgent(token, agentKey, {
        payload: cleanConfig,
        trigger_source: "dashboard",
        run_async: true,
      });

      const latestRuns = await fetchLatestRuns(token);
      setRuns(latestRuns);
      setActiveAgent(agentKey);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Unable to trigger the agent.");
    }
  }

  async function handleSaveConfig(agentKey: string) {
    if (!token) {
      return;
    }

    setDashboardError(null);
    setSaveMessage(null);

    try {
      const cleanConfig = sanitizeConfig(agentConfig[agentKey] ?? {});
      const saved = await saveAgentConfig(token, agentKey, cleanConfig);
      setAgentConfig((current) => ({
        ...current,
        [agentKey]: Object.fromEntries(
          Object.entries(saved.config).map(([key, value]) => [key, String(value ?? "")]),
        ),
      }));
      setSaveMessage(`Configuration sauvegardee pour ${agentKey}.`);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Unable to save configuration.");
    }
  }

  if (!user) {
    return (
      <main className="control-shell">
        <div className="control-backdrop">
          <div className="control-noise" />
          <div className="control-mesh" />
          <div className="control-glow control-glow-a" />
          <div className="control-glow control-glow-b" />
        </div>

        <AuthScreen
          loginError={loginError}
          onLogin={handleLogin}
          onRegister={handleRegister}
          registerError={registerError}
        />
      </main>
    );
  }

  return (
    <main className="control-shell">
      <div className="control-backdrop">
        <div className="control-noise" />
        <div className="control-mesh" />
        <div className="control-glow control-glow-a" />
        <div className="control-glow control-glow-b" />
      </div>

      <div className="control-app">
        <SidebarRail />

        <section className="main-column">
          <HeroHeader
            activeRuns={activeRuns}
            activeTab={activeTab}
            completedRuns={completedRuns}
            connectedCardsCount={connectedCardsCount}
            enabledAgentsCount={agents.filter((agent) => agent.enabled).length}
            onActiveTabChange={setActiveTab}
            onLaunchSelected={() => selectedAgent && void handleTrigger(selectedAgent.key)}
            onSearchChange={setSearchQuery}
            operatorName={operatorName}
            searchQuery={searchQuery}
          />

          <div className="dashboard-layout">
            <section className="cards-panel">
              <div className="cards-grid">
                {visibleCards.map((card, index) => (
                  <HubAgentCard
                    card={card}
                    config={agentConfig[card.key] ?? {}}
                    key={card.key}
                    latestRun={latestRunMap[card.key] ?? null}
                    onChange={handleConfigChange}
                    onSave={handleSaveConfig}
                    onSelect={() => {
                      if (isRealAgentKey(card.key)) {
                        setActiveAgent(card.key);
                      }
                    }}
                    onTrigger={() => {
                      if (isRealAgentKey(card.key)) {
                        void handleTrigger(card.key);
                      }
                    }}
                    selected={card.key === activeAgent}
                    styleDelay={index * 60}
                  />
                ))}
              </div>
            </section>

            <aside className="utility-rail">
              <PersonalAssistantCard operatorName={operatorName} />
              <DayCard runs={runs} />
              <FocusCard selectedAgent={selectedAgent} selectedRun={selectedRun} />
            </aside>
          </div>

          <div className="lower-layout">
            <ScenarioSection agents={agents} runs={runs} />
            <GlobalViewSection agentsCount={agents.length} completedRuns={completedRuns} domainStatus={domainStatus} />
          </div>

          <FooterStatusBar
            activeRuns={activeRuns}
            agents={agents}
            latestRunMap={latestRunMap}
            now={now}
            runs={runs}
            userIsActive={user.is_active}
          />

          {saveMessage ? <div className="toast success">{saveMessage}</div> : null}
          {dashboardError ? <div className="toast error">{dashboardError}</div> : null}
          {isLoading ? <div className="sr-only" aria-live="polite">Chargement du cockpit</div> : null}
        </section>
      </div>
    </main>
  );
}
