export type AgentFamily =
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

export type AccentColor = "cyan" | "violet" | "green" | "amber" | "pink";

export type DisplayCard = {
  key: string;
  title: string;
  badge: string;
  state: "active" | "standby";
  family: AgentFamily;
  cta: string;
  accent: AccentColor;
  description: string;
};

export type AgentConfigMap = Record<string, Record<string, string>>;

export type DashboardIconName =
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
  | AgentFamily;
