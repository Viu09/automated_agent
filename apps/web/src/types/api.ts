export type AgentListItem = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: string | null;
  default_config: Record<string, unknown>;
};

export type AgentResultRead = {
  id: number;
  result_type: string;
  content: Record<string, unknown>;
  created_at: string;
};

export type AgentRunRead = {
  id: number;
  user_id: number | null;
  agent_key: string;
  status: string;
  trigger_source: string;
  payload: Record<string, unknown>;
  summary: string | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
  results: AgentResultRead[];
};

export type UserRead = {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  created_at: string;
};

export type AccessToken = {
  access_token: string;
  token_type: string;
};

export type AuthPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string;
};

export type TriggerPayload = {
  payload: Record<string, unknown>;
  trigger_source?: string;
  run_async?: boolean;
};

export type AgentConfigRead = {
  id: number;
  agent_key: string;
  config: Record<string, unknown>;
  updated_at: string;
};

export type UserPreferenceRead = {
  id: number;
  preferences: Record<string, unknown>;
  updated_at: string;
};
