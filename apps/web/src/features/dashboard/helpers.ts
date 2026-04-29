import type { AgentConfigRead, AgentListItem, AgentRunRead, UserPreferenceRead } from "@/types/api";

import type { AgentConfigMap, DashboardIconName } from "./types";

export function mergeDefaultConfig(
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

export function sanitizeConfig(config: Record<string, string>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(config)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== ""),
  );
}

export function getPreferredActiveAgent(preferences: UserPreferenceRead | null) {
  const candidate = preferences?.preferences?.active_agent;
  return typeof candidate === "string" ? candidate : null;
}

export function tabMatchesCard(tab: string, key: string) {
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

export function getConnectedCount(keys: string[], latestRunMap: Record<string, AgentRunRead>) {
  const connected = keys.filter((key) => Boolean(latestRunMap[key])).length;
  return `${connected}/${keys.length}`;
}

export function getIconNameForAgent(key: string): DashboardIconName {
  const mapping: Record<string, DashboardIconName> = {
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

export function isRealAgentKey(key: string) {
  return key === "weather" || key === "news" || key === "productivity";
}
