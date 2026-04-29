import type {
  AccessToken,
  AgentConfigRead,
  AgentListItem,
  AgentRunRead,
  AuthPayload,
  RegisterPayload,
  TriggerPayload,
  UserPreferenceRead,
  UserRead,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {}
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function registerUser(payload: RegisterPayload): Promise<UserRead> {
  return request<UserRead>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: AuthPayload): Promise<AccessToken> {
  return request<AccessToken>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchProfile(token: string): Promise<UserRead> {
  return request<UserRead>("/auth/me", { method: "GET" }, token);
}

export async function fetchUserPreferences(token: string): Promise<UserPreferenceRead | null> {
  return request<UserPreferenceRead | null>("/users/preferences", { method: "GET" }, token);
}

export async function saveUserPreferences(
  token: string,
  preferences: Record<string, unknown>,
): Promise<UserPreferenceRead> {
  return request<UserPreferenceRead>(
    "/users/preferences",
    {
      method: "PUT",
      body: JSON.stringify({ preferences }),
    },
    token,
  );
}

export async function fetchAgents(token: string): Promise<AgentListItem[]> {
  return request<AgentListItem[]>("/agents", { method: "GET" }, token);
}

export async function fetchAgentConfigs(token: string): Promise<AgentConfigRead[]> {
  return request<AgentConfigRead[]>("/agent-configs", { method: "GET" }, token);
}

export async function saveAgentConfig(
  token: string,
  agentKey: string,
  config: Record<string, unknown>,
): Promise<AgentConfigRead> {
  return request<AgentConfigRead>(
    `/agent-configs/${agentKey}`,
    {
      method: "PUT",
      body: JSON.stringify({ config }),
    },
    token,
  );
}

export async function fetchLatestRuns(token: string): Promise<AgentRunRead[]> {
  return request<AgentRunRead[]>("/results/latest", { method: "GET" }, token);
}

export async function triggerAgent(token: string, agentKey: string, payload: TriggerPayload): Promise<AgentRunRead> {
  return request<AgentRunRead>(
    `/agents/${agentKey}/trigger`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}
