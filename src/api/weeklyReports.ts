/** Agent 周报系统 API client */

export interface WeeklyReport {
  id: string;
  agentId: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  completedTasks: Array<{ title: string; status: string; description?: string }>;
  nextWeekPlan: string;
  blockers: string;
  metrics: {
    tasksCompleted?: number;
    avgCycleHours?: number;
    statusDistribution?: Record<string, number>;
  };
  status: 'draft' | 'submitted' | 'reviewed' | 'needs_revision';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    name: string;
    displayName: string;
    avatar: string | null;
    tags: string[];
  };
}

export interface WeeklyReportSummary {
  weekRange: { start: string; end: string };
  totalReports: number;
  totalTasksCompleted: number;
  statusDistribution: Record<string, number>;
  agents: Array<{
    agentId: string;
    agentName: string;
    agentTags: string[];
    weekStart: string;
    summary: string;
    status: string;
    metrics: WeeklyReport['metrics'];
    completedTasks: WeeklyReport['completedTasks'];
  }>;
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
        password: 'agent2026',
      }),
    });
    const data = await res.json();
    const token = data.accessToken || data.token;
    if (token) {
      sessionStorage.setItem('kanban_token', token);
    }
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

/** 获取周报列表 */
export async function getWeeklyReports(params?: {
  agentId?: string;
  status?: string;
  weekStart?: string;
  weekEnd?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: WeeklyReport[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
  const qs = new URLSearchParams();
  if (params?.agentId) qs.set('agentId', params.agentId);
  if (params?.status) qs.set('status', params.status);
  if (params?.weekStart) qs.set('weekStart', params.weekStart);
  if (params?.weekEnd) qs.set('weekEnd', params.weekEnd);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  const q = qs.toString();
  return api(`/weekly-reports${q ? `?${q}` : ''}`);
}

/** 获取待审批周报 */
export async function getPendingReports(): Promise<{ data: WeeklyReport[] }> {
  return api('/weekly-reports/pending');
}

/** 获取周报汇总 */
export async function getWeeklySummary(params?: {
  weekStart?: string;
  weekEnd?: string;
}): Promise<{ data: WeeklyReportSummary }> {
  const qs = new URLSearchParams();
  if (params?.weekStart) qs.set('weekStart', params.weekStart);
  if (params?.weekEnd) qs.set('weekEnd', params.weekEnd);
  const q = qs.toString();
  return api(`/weekly-reports/summary${q ? `?${q}` : ''}`);
}

/** 获取单个周报 */
export async function getWeeklyReport(id: string): Promise<{ data: WeeklyReport }> {
  return api(`/weekly-reports/${id}`);
}

/** 提交周报 */
export async function submitWeeklyReport(data: {
  agentId: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  completedTasks?: WeeklyReport['completedTasks'];
  nextWeekPlan?: string;
  blockers?: string;
  metrics?: WeeklyReport['metrics'];
}): Promise<{ data: WeeklyReport }> {
  return api('/weekly-reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 审批周报 */
export async function reviewWeeklyReport(
  id: string,
  data: { status: 'reviewed' | 'needs_revision'; reviewComment?: string }
): Promise<{ data: WeeklyReport }> {
  return api(`/weekly-reports/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** 获取 Agent 列表（用于筛选） */
export async function getAgents(): Promise<{ data: Array<{ id: string; name: string; displayName: string; avatar: string | null; tags: string[] }> }> {
  return api('/agents');
}
