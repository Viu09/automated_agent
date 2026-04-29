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
  AgentConfigRead,
  AgentListItem,
  AgentRunRead,
  AuthPayload,
  RegisterPayload,
  UserPreferenceRead,
  UserRead,
} from "@/types/api";

const TOKEN_STORAGE_KEY = "life_os_token";
const CATEGORY_TABS = [
  "Tous les agents",
  "Informations",
  "Productivite",
  "Bien-etre",
  "Developpement",
  "Finance",
  "Creativite",
  "Social",
];

const NAV_ITEMS = [
  { label: "Accueil", icon: "home" },
  { label: "Mes agents", icon: "agents" },
  { label: "Scenarios", icon: "scenario" },
  { label: "Tableaux de bord", icon: "boards" },
  { label: "Donnees", icon: "database" },
  { label: "Calendrier", icon: "calendar" },
  { label: "Messages", icon: "message" },
  { label: "Automatisations", icon: "automation" },
  { label: "Integrations", icon: "integration" },
  { label: "Parametres", icon: "settings" },
] as const;

type AgentConfigMap = Record<string, Record<string, string>>;

type DisplayCard = {
  key: string;
  title: string;
  badge: string;
  state: "active" | "standby";
  family: "weather" | "news" | "productivity" | "project" | "health" | "finance" | "agenda" | "learning" | "creative" | "social";
  cta: string;
  accent: "cyan" | "violet" | "green" | "amber" | "pink";
  description: string;
};

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

        if (!cancelled) {
          setUser(profile);
          setAgents(agentList);
          setRuns(latestRuns);
          setAgentConfig((current) => mergeDefaultConfig(current, agentList, persistedConfigs));
          setPreferencesLoaded(true);

          const preferredAgent = getPreferredActiveAgent(preferences);
          if (preferredAgent && agentList.find((item) => item.key === preferredAgent)) {
            setActiveAgent(preferredAgent);
          } else if (agentList[0]) {
            setActiveAgent(agentList[0].key);
          }
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

    loadDashboard();
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
  }, [token, preferencesLoaded, activeAgent]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    async function refreshRuns() {
      if (document.visibilityState === "hidden") {
        schedule(45000);
        return;
      }

      try {
        const latestRuns = await fetchLatestRuns(token);
        if (!cancelled) {
          setRuns((current) => {
            const nextSerialized = JSON.stringify(latestRuns);
            const currentSerialized = JSON.stringify(current);
            return nextSerialized === currentSerialized ? current : latestRuns;
          });
        }
      } catch {}

      const hasLiveRuns = runs.some((run) => run.status === "running" || run.status === "queued");
      schedule(hasLiveRuns ? 12000 : 30000);
    }

    function schedule(delay: number) {
      timeoutId = window.setTimeout(() => {
        void refreshRuns();
      }, delay);
    }

    schedule(30000);
    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [token, runs]);

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
  const realAgentKeys = useMemo(() => new Set(agents.map((agent) => agent.key)), [agents]);

  const cardBlueprints = useMemo<DisplayCard[]>(
    () => [
      {
        key: "weather",
        title: "METEO",
        badge: "Actif",
        state: "active",
        family: "weather",
        cta: "Previsions detaillees",
        accent: "cyan",
        description: "Conditions locales et recommandations",
      },
      {
        key: "news",
        title: "NEWS",
        badge: "Actif",
        state: "active",
        family: "news",
        cta: "Voir les articles",
        accent: "violet",
        description: "A la une et veille personnalisee",
      },
      {
        key: "productivity",
        title: "DEVELOPPEMENT PERSONNEL",
        badge: "Actif",
        state: "active",
        family: "productivity",
        cta: "Voir mes objectifs",
        accent: "green",
        description: "Execution, focus et repository",
      },
      {
        key: "project",
        title: "SUIVI DE PROJET",
        badge: "A connecter",
        state: "standby",
        family: "project",
        cta: "Ouvrir le projet",
        accent: "cyan",
        description: "Project Nova et avancement global",
      },
      {
        key: "health",
        title: "SANTE",
        badge: "A connecter",
        state: "standby",
        family: "health",
        cta: "Voir le tableau de bord",
        accent: "pink",
        description: "Score bien-etre, sommeil et activite",
      },
      {
        key: "finance",
        title: "FINANCES",
        badge: "A connecter",
        state: "standby",
        family: "finance",
        cta: "Voir l'analyse",
        accent: "green",
        description: "Depenses et budget du mois",
      },
      {
        key: "agenda",
        title: "AGENDA",
        badge: "A connecter",
        state: "standby",
        family: "agenda",
        cta: "Ouvrir l'agenda",
        accent: "cyan",
        description: "Rythme de la journee et rendez-vous",
      },
      {
        key: "learning",
        title: "APPRENTISSAGE",
        badge: "En veille",
        state: "standby",
        family: "learning",
        cta: "Continuer",
        accent: "violet",
        description: "Cours, progression et objectifs",
      },
      {
        key: "creative",
        title: "CREATIVITE",
        badge: "Actif",
        state: "active",
        family: "creative",
        cta: "Explorer",
        accent: "pink",
        description: "Idees et explorations visuelles",
      },
      {
        key: "social",
        title: "RELATIONS",
        badge: "En veille",
        state: "standby",
        family: "social",
        cta: "Voir mes contacts",
        accent: "violet",
        description: "Rappels relationnels et priorites",
      },
    ],
    [],
  );

  const visibleCards = useMemo(() => {
    return cardBlueprints.filter((card) => {
      const searchMatch =
        searchQuery.trim() === "" ||
        `${card.title} ${card.description} ${card.key}`.toLowerCase().includes(searchQuery.toLowerCase());
      const tabMatch = tabMatchesCard(activeTab, card.key);
      return searchMatch && tabMatch;
    });
  }, [activeTab, cardBlueprints, searchQuery]);

  const completedRuns = runs.filter((run) => run.status === "completed").length;
  const activeRuns = runs.filter((run) => run.status === "running" || run.status === "queued").length;
  const selectedRun = selectedAgent ? latestRunMap[selectedAgent.key] ?? null : null;
  const connectedCardsCount = cardBlueprints.filter((card) => Boolean(latestRunMap[card.key]) || realAgentKeys.has(card.key)).length;
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
      setPulseKey((value) => value + 1);
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

  return (
    <main className="control-shell">
      <div className="control-backdrop">
        <div className="control-noise" />
        <div className="control-mesh" />
        <div className="control-glow control-glow-a" />
        <div className="control-glow control-glow-b" />
      </div>

      {!user ? (
        <section className="access-screen">
          <div className="access-stage">
            <div className="access-copy">
              <span className="micro-tag">AGENTS HUB</span>
              <h1>Pilotez votre vie. Vos agents s'occupent du reste.</h1>
              <p>Une interface de commandement futuriste, riche, animee et personnalisee autour de vos automations.</p>
            </div>
            <div className="access-grid">
              <AccessCard
                title="Connexion"
                subtitle="Rouvrez votre hub et retrouvez vos modules."
                buttonLabel="Entrer dans le hub"
                error={loginError}
                fields={[
                  { name: "email", type: "email", placeholder: "Email" },
                  { name: "password", type: "password", placeholder: "Mot de passe" },
                ]}
                onSubmit={handleLogin}
              />
              <AccessCard
                title="Creer un profil"
                subtitle="Provisionnez votre identite operateur."
                buttonLabel="Creer le profil"
                error={registerError?.startsWith("Compte cree") ? null : registerError}
                successMessage={registerError?.startsWith("Compte cree") ? registerError : null}
                fields={[
                  { name: "full_name", type: "text", placeholder: "Nom complet" },
                  { name: "email", type: "email", placeholder: "Email" },
                  { name: "password", type: "password", placeholder: "Mot de passe", minLength: 8 },
                ]}
                onSubmit={handleRegister}
              />
            </div>
          </div>
        </section>
      ) : (
        <div className="control-app">
          <aside className="left-rail">
            <div className="brand-block">
              <div className="brand-glyph">
                <div className="brand-glyph-inner" />
              </div>
              <div>
                <strong>AGENTS HUB</strong>
                <small>Life OS cockpit</small>
              </div>
            </div>

            <nav className="nav-cluster">
              {NAV_ITEMS.map((item, index) => (
                <button className={`nav-chip ${index === 0 ? "nav-chip-active" : ""}`} key={item.label} type="button">
                  <IconGlyph name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="spaces-cluster">
              <span className="section-kicker">ESPACES</span>
              {["Personnel", "Projets", "Business", "Sante & Bien-etre", "Apprentissage"].map((item, index) => (
                <div className="space-row" key={item}>
                  <span className={`space-node color-${index + 1}`} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="sync-pod">
              <span className="section-kicker">SYNCHRO TOTALE</span>
              <p>Tous vos agents sont a jour.</p>
              <div className="sync-orbit">
                <div className="sync-ring ring-1" />
                <div className="sync-ring ring-2" />
                <div className="sync-ring ring-3" />
                <div className="sync-core" />
              </div>
              <button className="ghost-button wide" type="button">
                Voir les logs
              </button>
            </div>
          </aside>

          <section className="main-column">
            <header className="hero-bar">
              <div className="hero-copy">
                <small>Bonjour {operatorName}</small>
                <h1>Pilotez votre vie. Vos agents s'occupent du reste.</h1>
              </div>
              <div className="hero-actions">
                <label className="search-bar">
                  <span className="search-lens" />
                  <input
                    className="search-field"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Rechercher un agent, une action, une donnee..."
                    type="text"
                    value={searchQuery}
                  />
                </label>
                <button className="ghost-button" type="button">
                  Marketplace d'agents
                </button>
                <button className="primary-button" onClick={() => selectedAgent && handleTrigger(selectedAgent.key)} type="button">
                  + Ajouter un agent
                </button>
                <div className="user-orb" />
              </div>
            </header>

            <section className="stats-ribbon">
              <StatTile label="Agents exposes" value={String(connectedCardsCount)} />
              <StatTile label="Agents backend actifs" value={String(agents.filter((agent) => agent.enabled).length)} />
              <StatTile label="Executions completes" value={String(completedRuns)} />
              <StatTile label="Executions en cours" value={String(activeRuns)} />
            </section>

            <section className="category-ribbon">
              {CATEGORY_TABS.map((tab) => (
                <button
                  className={`category-pill ${tab === activeTab ? "category-pill-active" : ""}`}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </section>

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
                        if (card.key === "weather" || card.key === "news" || card.key === "productivity") {
                          setActiveAgent(card.key);
                        }
                      }}
                      onTrigger={() => {
                        if (card.key === "weather" || card.key === "news" || card.key === "productivity") {
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
              <section className="scenario-card">
                <div className="section-head">
                  <div>
                    <span className="section-kicker">SCENARIOS AUTOMATISES</span>
                    <h2>Votre chaine d'automatisation</h2>
                  </div>
                  <div className="toggle-chip">ON</div>
                </div>
                <div className="scenario-flow">
                  {agents.length > 0 ? (
                    agents.slice(0, 5).map((agent) => (
                      <div className="scenario-node" key={agent.key}>
                        <div className="scenario-icon">
                          <IconGlyph name={getIconNameForAgent(agent.key)} />
                        </div>
                        <strong>{agent.schedule ?? "manuel"}</strong>
                        <span>{agent.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-block">
                      <strong>Aucun scenario source</strong>
                      <span>Connectez des agents avec un planning pour voir une chaine reelle.</span>
                    </div>
                  )}
                </div>

                <div className="recent-automation">
                  {runs.slice(0, 4).length > 0 ? (
                    runs.slice(0, 4).map((run) => (
                      <div className="automation-tile" key={run.id}>
                        <strong>{run.agent_key}</strong>
                        <span>{run.summary ?? run.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-block compact">
                      <strong>Aucune automatisation recente</strong>
                      <span>Declenchez un agent pour peupler cette zone.</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="global-view-card">
                <div className="section-head">
                  <div>
                    <span className="section-kicker">VUE GLOBALE</span>
                    <h2>Tous vos domaines en harmonie</h2>
                  </div>
                </div>
                <div className="global-stage">
                  <div className="badge-column left">
                    <GlobalBadge label="Productivite" value={domainStatus.productivity} />
                    <GlobalBadge label="Apprentissage" value={domainStatus.learning} />
                    <GlobalBadge label="Finances" value={domainStatus.finance} />
                  </div>

                  <div className="city-diorama">
                    <div className="city-platform" />
                    <div className="city-haze" />
                    <div className="tower tower-1" />
                    <div className="tower tower-2" />
                    <div className="tower tower-3" />
                    <div className="tower tower-4" />
                    <div className="tower tower-5" />
                    <div className="city-rings" />
                    <div className="city-score-badge">
                      <span>couverture</span>
                      <strong>{`${completedRuns}/${Math.max(agents.length, 1)}`}</strong>
                    </div>
                  </div>

                  <div className="badge-column right">
                    <GlobalBadge label="Sante" value={domainStatus.health} />
                    <GlobalBadge label="Relations" value={domainStatus.social} />
                    <GlobalBadge label="Creativite" value={domainStatus.creative} />
                  </div>
                </div>
              </section>
            </div>

            <footer className="footer-ribbon">
              <FooterIndicator label="Meteo" value={latestRunMap.weather ? "Sync" : "A connecter"} />
              <FooterIndicator label="Connexions" value={`${agents.filter((agent) => agent.enabled).length} actives`} />
              <FooterIndicator label="Session" value={user.is_active ? "Active" : "Inactive"} />
              <FooterIndicator label="Dernier run" value={runs[0]?.started_at ? new Date(runs[0].started_at).toLocaleTimeString() : "Aucun"} />
              <FooterIndicator label="Rafraichissement" value={activeRuns > 0 ? "12s live" : "30s calme"} />
              <div className="footer-time">
                <strong>{now.toLocaleTimeString()}</strong>
                <span>{now.toLocaleDateString()}</span>
              </div>
            </footer>

            {saveMessage ? <div className="toast success">{saveMessage}</div> : null}
            {dashboardError ? <div className="toast error">{dashboardError}</div> : null}
          </section>
        </div>
      )}
    </main>
  );
}

function AccessCard({
  title,
  subtitle,
  buttonLabel,
  error,
  successMessage,
  fields,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  error: string | null;
  successMessage?: string | null;
  fields: Array<{ name: string; type: string; placeholder: string; minLength?: number }>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  return (
    <div className="access-card">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <form className="access-form" onSubmit={onSubmit}>
        {fields.map((field) => (
          <input
            className="field-input"
            key={field.name}
            minLength={field.minLength}
            name={field.name}
            placeholder={field.placeholder}
            required={field.name !== "full_name"}
            type={field.type}
          />
        ))}
        <button className="primary-button wide" type="submit">
          {buttonLabel}
        </button>
      </form>
      {successMessage ? <div className="feedback success">{successMessage}</div> : null}
      {!successMessage && error ? <div className="feedback error">{error}</div> : null}
    </div>
  );
}

function HubAgentCard({
  card,
  latestRun,
  config,
  selected,
  onSelect,
  onTrigger,
  onSave,
  onChange,
  styleDelay,
}: {
  card: DisplayCard;
  latestRun: AgentRunRead | null;
  config: Record<string, string>;
  selected: boolean;
  onSelect: () => void;
  onTrigger: () => void;
  onSave: () => void;
  onChange: (agentKey: string, field: string, value: string) => void;
  styleDelay: number;
}) {
  const liveState = latestRun?.status ?? "idle";
  const isRealAgent = card.key === "weather" || card.key === "news" || card.key === "productivity";

  return (
    <article
      className={`hub-card accent-${card.accent} ${selected ? "hub-card-selected" : ""} run-${liveState}`}
      data-family={card.family}
      data-live={liveState}
      onClick={onSelect}
      style={{ animationDelay: `${styleDelay}ms` }}
    >
      <div className="hub-card-aura" />
      <div className="hub-card-gridline" />
      <div className="hub-card-header">
        <div className="hub-card-title">
          <IconGlyph name={getIconNameForAgent(card.key)} />
          <strong>{card.title}</strong>
        </div>
        <div className={`status-mini ${card.state === "active" ? "status-active" : "status-standby"}`}>{card.badge}</div>
      </div>

      <div className="hub-card-body">
        <div className="avatar-stage">
          <RobotAvatar family={card.family} accent={card.accent} />
        </div>
        <div className="card-data-block">{renderAgentCardBody(card, latestRun, config)}</div>
      </div>

      <div className="telemetry-strip">
        <span>{latestRun?.summary ?? card.description}</span>
        <small>{latestRun?.started_at ? new Date(latestRun.started_at).toLocaleTimeString() : "Pret"}</small>
      </div>

      {isRealAgent ? (
        <div className="card-controls">
          {renderCompactControls(card, config, onChange)}
        </div>
      ) : null}

      <div className="hub-card-footer">
        {isRealAgent ? (
          <>
            <button className="ghost-button small" onClick={(event) => { event.stopPropagation(); onSave(); }} type="button">
              Sauver
            </button>
            <button className="primary-button small" onClick={(event) => { event.stopPropagation(); onTrigger(); }} type="button">
              {card.cta}
            </button>
          </>
        ) : (
          <>
            <div className="status-mini status-standby">Module scene</div>
            <button className="ghost-button small" type="button">
              {card.cta}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function PersonalAssistantCard({ operatorName }: { operatorName: string }) {
  return (
    <section className="assistant-card">
      <div className="section-head">
        <span className="section-kicker">ASSISTANT PERSONNEL</span>
        <div className="status-mini status-active">Actif</div>
      </div>
      <div className="assistant-stage">
        <div className="assistant-rings" />
        <RobotAvatar family="social" accent="cyan" large />
      </div>
      <p>Je suis la pour vous aider, {operatorName}. Que souhaitez-vous faire ?</p>
      <div className="assistant-grid-actions">
        {["Planifier ma journee", "Resumer mes emails", "Preparer une reunion", "Analyser mes donnees"].map((item) => (
          <button className="assistant-action" key={item} type="button">
            {item}
          </button>
        ))}
      </div>
      <div className="assistant-composer">
        <input className="search-field" placeholder="Parlez ou ecrivez ici..." type="text" />
      </div>
    </section>
  );
}

function DayCard({ runs }: { runs: AgentRunRead[] }) {
  const items = runs.slice(0, 4).map((run) => ({
    label: run.agent_key,
    time: run.started_at ? new Date(run.started_at).toLocaleTimeString() : run.status,
  }));

  return (
    <section className="schedule-card">
      <div className="section-head">
        <span className="section-kicker">APERCU DE VOTRE JOURNEE</span>
      </div>
      {items.length > 0 ? (
        <div className="schedule-list">
          {items.map((item) => (
            <div className="schedule-row" key={`${item.label}-${item.time}`}>
              <span>{item.label}</span>
              <small>{item.time}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-block compact">
          <strong>Aucune donnee de calendrier</strong>
          <span>Connectez un agenda ou lancez des agents pour afficher une timeline reelle.</span>
        </div>
      )}
      <button className="ghost-button wide" type="button">
        Voir le journal d'execution
      </button>
    </section>
  );
}

function FocusCard({
  selectedAgent,
  selectedRun,
}: {
  selectedAgent: AgentListItem | null;
  selectedRun: AgentRunRead | null;
}) {
  return (
    <section className="focus-card">
      <div className="section-head">
        <span className="section-kicker">FOCUS DU JOUR</span>
      </div>
      <div className="focus-grid">
        <div className="focus-copy">
          <strong>{selectedAgent?.name ?? "Aucun module actif"}</strong>
          <span>{selectedRun?.summary ?? "Aucune mission prioritaire calculee."}</span>
          <span>{selectedRun?.status ? `Etat: ${selectedRun.status}` : "Declenchez un agent pour demarrer."}</span>
        </div>
        <div className="focus-clock">
          <div className="focus-clock-ring" />
          <strong>{selectedRun?.results?.length ? String(selectedRun.results.length).padStart(2, "0") : "00"}</strong>
        </div>
      </div>
      <button className="primary-button wide" type="button">
        Ouvrir le module
      </button>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function GlobalBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="global-badge">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FooterIndicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="footer-indicator">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function renderAgentCardBody(card: DisplayCard, run: AgentRunRead | null, config: Record<string, string>) {
  const result = run?.results?.[0]?.content ?? {};

  if (card.family === "weather") {
    if (!run) {
      return renderNoDataState("Aucune mesure meteo", config.location_label ? `Lieu configure: ${config.location_label}` : "Configurez une ville puis lancez l'agent.");
    }
    const conditions = (result.conditions as Record<string, unknown> | undefined) ?? {};
    const temperature = conditions.temperature_c;
    const rain = conditions.precipitation_mm;
    const wind = conditions.wind_speed_kmh;
    const label = config.location_label || String(result.location_label ?? "Paris, France");
    return (
      <>
        <div className="hero-metric">
          <strong>{temperature !== undefined ? `${temperature}°C` : "N/A"}</strong>
          <span>{label}</span>
        </div>
        <div className="mini-insights">
          {typeof result.recommendation === "string" ? <span>{result.recommendation}</span> : null}
          <span>{rain !== undefined ? `${rain} mm pluie` : "Pluie indisponible"}</span>
          <span>{wind !== undefined ? `${wind} km/h vent` : "Vent indisponible"}</span>
        </div>
      </>
    );
  }

  if (card.family === "news") {
    const headlines = Array.isArray(result.headlines) ? result.headlines : [];
    if (headlines.length === 0) {
      return renderNoDataState("Aucun article disponible", config.topic ? `Topic configure: ${config.topic}` : "Renseignez un topic puis lancez l'agent.");
    }
    return (
      <div className="bullet-feed">
        {headlines.slice(0, 3).map((headline, index) => {
          const item = headline as Record<string, unknown>;
          const title = String(item.title ?? "Headline");
          const url = typeof item.url === "string" ? item.url : null;
          return url ? (
            <a href={url} key={`${card.key}-${index}`} rel="noreferrer" target="_blank">
              {title}
            </a>
          ) : (
            <span key={`${card.key}-${index}`}>{title}</span>
          );
        })}
      </div>
    );
  }

  if (card.family === "productivity") {
    if (!run) {
      const repoLabel = config.owner && config.repo ? `${config.owner}/${config.repo}` : "Aucun depot configure";
      return renderNoDataState("Aucune synchronisation GitHub", repoLabel);
    }
    const openIssues = typeof result.open_issues === "number" ? result.open_issues : 0;
    const ratio = Math.min(openIssues * 8, 100);
    const repo = typeof result.repository === "string"
      ? result.repository
      : config.owner && config.repo
        ? `${config.owner}/${config.repo}`
        : "Depot inconnu";
    return (
      <>
        <div className="metric-caption">{repo}</div>
        <span className="metric-note">{typeof result.focus === "string" ? result.focus : "Aucun focus extrait pour le moment."}</span>
        <div className="progress-pair">
          <div className="progress-track">
            <div className="progress-value" style={{ width: `${ratio}%` }} />
          </div>
          <strong>{Math.round(ratio)}%</strong>
        </div>
      </>
    );
  }

  return renderNoDataState("Aucune donnee connectee", "Ce module est visible dans le cockpit mais n'a pas encore de source reelle.");
}

function renderCompactControls(
  card: DisplayCard,
  config: Record<string, string>,
  onChange: (agentKey: string, field: string, value: string) => void,
) {
  if (card.key === "weather") {
    return (
      <>
        <input className="mini-input" onChange={(e) => onChange(card.key, "location_label", e.target.value)} placeholder="Ville" type="text" value={config.location_label ?? ""} />
        <input className="mini-input" onChange={(e) => onChange(card.key, "latitude", e.target.value)} placeholder="Lat" type="text" value={config.latitude ?? ""} />
        <input className="mini-input" onChange={(e) => onChange(card.key, "longitude", e.target.value)} placeholder="Lon" type="text" value={config.longitude ?? ""} />
      </>
    );
  }

  if (card.key === "news") {
    return <input className="mini-input" onChange={(e) => onChange(card.key, "topic", e.target.value)} placeholder="Topic" type="text" value={config.topic ?? ""} />;
  }

  if (card.key === "productivity") {
    return (
      <>
        <input className="mini-input" onChange={(e) => onChange(card.key, "owner", e.target.value)} placeholder="Owner" type="text" value={config.owner ?? ""} />
        <input className="mini-input" onChange={(e) => onChange(card.key, "repo", e.target.value)} placeholder="Repo" type="text" value={config.repo ?? ""} />
      </>
    );
  }

  return null;
}

function RobotAvatar({
  family,
  accent,
  large = false,
}: {
  family: DisplayCard["family"];
  accent: DisplayCard["accent"];
  large?: boolean;
}) {
  return (
    <div className={`avatar-shell ${large ? "avatar-large" : ""} accent-${accent} family-${family}`}>
      <div className="avatar-orbit orbit-one" />
      <div className="avatar-orbit orbit-two" />
      <div className="avatar-orbit orbit-three" />
      <div className="avatar-bot">
        <div className="avatar-head">
          <span className="avatar-eye left" />
          <span className="avatar-eye right" />
        </div>
        <div className="avatar-torso" />
        <div className="avatar-core" />
      </div>
    </div>
  );
}

function IconGlyph({
  name,
}: {
  name:
    | "home"
    | "agents"
    | "scenario"
    | "boards"
    | "database"
    | "calendar"
    | "message"
    | "automation"
    | "integration"
    | "settings"
    | "weather"
    | "news"
    | "productivity"
    | "project"
    | "health"
    | "finance"
    | "agenda"
    | "learning"
    | "creative"
    | "social";
}) {
  return (
    <span className="icon-glyph" data-icon={name}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        {renderIconPath(name)}
      </svg>
    </span>
  );
}

function renderIconPath(name: string) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home":
      return <path {...common} d="M3 11.5 12 4l9 7.5M6.5 10.5V20h11v-9.5M10 20v-5h4v5" />;
    case "agents":
      return <><circle {...common} cx="8" cy="9" r="3" /><circle {...common} cx="16.5" cy="8.5" r="2.5" /><path {...common} d="M4 19c.8-2.7 2.9-4 6-4s5.2 1.3 6 4M14.5 18.5c.5-1.8 1.9-2.8 4-3.1" /></>;
    case "scenario":
      return <><path {...common} d="M5 6h5v5H5zM14 13h5v5h-5z" /><path {...common} d="M10 8.5h4m-2 0v4" /><path {...common} d="M12 13v-2.5c0-1.1.9-2 2-2h0" /></>;
    case "boards":
      return <><rect {...common} x="4" y="5" width="7" height="6" rx="1.5" /><rect {...common} x="13" y="5" width="7" height="4" rx="1.5" /><rect {...common} x="13" y="11" width="7" height="8" rx="1.5" /><rect {...common} x="4" y="13" width="7" height="6" rx="1.5" /></>;
    case "database":
      return <><ellipse {...common} cx="12" cy="6" rx="7" ry="3" /><path {...common} d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>;
    case "calendar":
    case "agenda":
      return <><rect {...common} x="4" y="5" width="16" height="15" rx="2" /><path {...common} d="M8 3v4M16 3v4M4 9h16" /></>;
    case "message":
      return <><path {...common} d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 3v-5H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /></>;
    case "automation":
      return <><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.4 1.5Z" /></>;
    case "integration":
      return <><path {...common} d="M8 7a3 3 0 1 1 0 6H5M16 17a3 3 0 1 1 0-6h3M8 10h8M10 14h4" /></>;
    case "settings":
      return <><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.4 1.5Z" /></>;
    case "weather":
      return <><path {...common} d="M7 17h9a4 4 0 0 0 .3-8A5 5 0 0 0 6.4 9.8 3.5 3.5 0 0 0 7 17Z" /><path {...common} d="m10 18-1 2m4-2-1 2m4-2-1 2M12 4v2M5.6 6.6 7 8m10-1.4L15.6 8M4 12h2m12 0h2" /></>;
    case "news":
      return <><rect {...common} x="4" y="5" width="16" height="14" rx="2" /><path {...common} d="M8 9h8M8 13h5M6.5 9h.01M6.5 13h.01" /></>;
    case "productivity":
      return <><path {...common} d="M12 3v18M6 12l6-9 6 9M6 12l6 9 6-9" /></>;
    case "project":
      return <><rect {...common} x="4" y="6" width="16" height="12" rx="2" /><path {...common} d="M8 6V4h8v2M8 12h3M8 15h8" /></>;
    case "health":
      return <path {...common} d="m12 20-1.2-1C6 14.7 3 12 3 8.5A4.5 4.5 0 0 1 7.5 4c1.7 0 3.1.8 4.5 2.3C13.4 4.8 14.8 4 16.5 4A4.5 4.5 0 0 1 21 8.5c0 3.5-3 6.2-7.8 10.5L12 20Z" />;
    case "finance":
      return <><circle {...common} cx="12" cy="12" r="8" /><path {...common} d="M12 7v10M15 9.5c0-1-1.3-1.8-3-1.8s-3 .8-3 1.8 1.3 1.8 3 1.8 3 .8 3 1.8-1.3 1.8-3 1.8-3-.8-3-1.8" /></>;
    case "learning":
      return <><path {...common} d="M4 6.5 12 4l8 2.5v11L12 20l-8-2.5z" /><path {...common} d="M12 4v16M8 8.5l4-1 4 1" /></>;
    case "creative":
      return <><path {...common} d="M12 3c2.8 0 5 2.2 5 5 0 1.8-.9 3-2 4 0 0 0 2 2 2H9c-2 0-2-2-2-2-1.1-1-2-2.2-2-4 0-2.8 2.2-5 5-5h2Z" /><path {...common} d="M10 18h4M10.5 21h3" /></>;
    case "social":
      return <><circle {...common} cx="9" cy="9" r="3" /><circle {...common} cx="17" cy="10" r="2.5" /><path {...common} d="M4 19c.8-2.7 2.9-4 6-4 1.5 0 2.8.3 3.8.9M14.5 18.5c.7-1.9 2-3 4-3.5" /></>;
    default:
      return <circle {...common} cx="12" cy="12" r="7" />;
  }
}

function renderNoDataState(title: string, subtitle: string) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </div>
  );
}

function mergeDefaultConfig(
  current: AgentConfigMap,
  agents: AgentListItem[],
  savedConfigs: AgentConfigRead[],
): AgentConfigMap {
  const merged = { ...current };
  const savedMap = Object.fromEntries(savedConfigs.map((item) => [item.agent_key, item.config]));

  for (const agent of agents) {
    const defaults = Object.fromEntries(
      Object.entries(agent.default_config ?? {}).map(([key, value]) => [key, String(value ?? "")]),
    );
    const saved = Object.fromEntries(
      Object.entries(savedMap[agent.key] ?? {}).map(([key, value]) => [key, String(value ?? "")]),
    );
    merged[agent.key] = { ...defaults, ...saved, ...(merged[agent.key] ?? {}) };
  }

  return merged;
}

function sanitizeConfig(config: Record<string, string>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(config)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== ""),
  );
}

function getPreferredActiveAgent(preferences: UserPreferenceRead | null) {
  const candidate = preferences?.preferences?.active_agent;
  return typeof candidate === "string" ? candidate : null;
}

function tabMatchesCard(tab: string, key: string) {
  if (tab === "Tous les agents") {
    return true;
  }
  const mapping: Record<string, string[]> = {
    Informations: ["weather", "news"],
    Productivite: ["productivity", "project", "agenda"],
    "Bien-etre": ["health", "weather"],
    Developpement: ["productivity", "project", "learning"],
    Finance: ["finance"],
    Creativite: ["creative"],
    Social: ["social"],
  };
  return mapping[tab]?.includes(key) ?? false;
}

function getConnectedCount(keys: string[], latestRunMap: Record<string, AgentRunRead>) {
  const connected = keys.filter((key) => Boolean(latestRunMap[key])).length;
  return `${connected}/${keys.length}`;
}

function getIconNameForAgent(key: string) {
  const mapping: Record<string, Parameters<typeof IconGlyph>[0]["name"]> = {
    weather: "weather",
    news: "news",
    productivity: "productivity",
    project: "project",
    health: "health",
    finance: "finance",
    agenda: "agenda",
    learning: "learning",
    creative: "creative",
    social: "social",
  };
  return mapping[key] ?? "agents";
}
