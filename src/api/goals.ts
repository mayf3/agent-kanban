/** Goals (Agent目标卡) API client */

export interface MonthlyGoal {
  text: string;
  status: 'not_started' | 'in_progress' | 'done';
}

export interface MonthlyGoalGroup {
  month: string; // "2026-05"
  goals: MonthlyGoal[];
}

export interface GoalCard {
  id: string;
  agentId: string;
  pipeline: string;
  upstreamAgentIds: string[];
  downstreamAgentIds: string[];
  longTermDirection: string;
  monthlyGoals: MonthlyGoalGroup[];
  selfCheckCriteria: string;
  pushedMonths: string[];
  status: 'active' | 'paused' | 'archived';
  lastReviewedAt: string | null;
  lastReviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    name: string;
    displayName: string;
    avatar: string | null;
  };
  stats?: {
    total: number;
    done: number;
    inProgress: number;
  };
}

const BASE_URL = import.meta.env.DEV
  ? 'http://<SERVER_IP>/api'
  : '/api';

async function getToken(): Promise<string> {
  const stored = sessionStorage.getItem('kanban_token');
  if (stored) return stored;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'frontend-react-engineer@agent.local',
        password: process.env.API_PASSWORD || '',
      }),
    });
    const data = await res.json();
    const token = data.accessToken || data.token;
    if (token) sessionStorage.setItem('kanban_token', token);
    return token;
  } catch {
    return '';
  }
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `API error: ${res.status}`);
  return data;
}

export async function getGoalCards(params?: {
  pipeline?: string;
  status?: string;
}): Promise<{ goalCards: GoalCard[] }> {
  const qs = new URLSearchParams();
  if (params?.pipeline) qs.set('pipeline', params.pipeline);
  if (params?.status) qs.set('status', params.status);
  const q = qs.toString();
  return api(`/goals${q ? `?${q}` : ''}`);
}

export async function getGoalCard(agentId: string): Promise<{ goalCard: GoalCard }> {
  return api(`/goals/${agentId}`);
}

export interface PipelineOption {
  value: string;
  label: string;
  count: number;
}

export async function getGoalCardPipelines(): Promise<PipelineOption[]> {
  const res = await getGoalCards();
  const pipelineMap = new Map<string, number>();
  for (const gc of res.goalCards) {
    pipelineMap.set(gc.pipeline, (pipelineMap.get(gc.pipeline) || 0) + 1);
  }
  return Array.from(pipelineMap.entries()).map(([value, count]) => ({
    value,
    label: value,
    count,
  }));
}
