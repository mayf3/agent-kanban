/** Postmortem (验尸报告) API client */

export interface Postmortem {
  id: string;
  requirementId: string | null;
  title: string;
  phenomenon: string;
  rootCause: string;
  whyExistingProcess: string;
  longTermPrinciple: string;
  preventionMeasures: string;
  responsiblePerson: string;
  status: 'pending' | 'implemented' | 'verified';
  createdAt: string;
  updatedAt: string;
  requirement: {
    id: string;
    title: string;
    priority: string;
    status: string;
  } | null;
}

export interface PostmortemStats {
  thisMonth: number;
  total: number;
  overdue: number;
  byStatus: Array<{ status: string; count: number }>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const BASE_URL = import.meta.env.DEV
  ? `${API_BASE_URL}/api`
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

export async function getPostmortems(params?: {
  status?: string;
  responsiblePerson?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ postmortems: Postmortem[]; total: number; page: number; pageSize: number }> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.responsiblePerson) qs.set('responsiblePerson', params.responsiblePerson);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  const q = qs.toString();
  return api(`/postmortems${q ? `?${q}` : ''}`);
}

export async function getPostmortem(id: string): Promise<{ postmortem: Postmortem }> {
  return api(`/postmortems/${id}`);
}

export async function createPostmortem(data: {
  requirementId?: string;
  title: string;
  phenomenon: string;
  rootCause: string;
  whyExistingProcess?: string;
  longTermPrinciple?: string;
  preventionMeasures: string;
  responsiblePerson: string;
}): Promise<{ postmortem: Postmortem }> {
  return api('/postmortems', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePostmortem(
  id: string,
  data: Partial<Pick<Postmortem, 'title' | 'phenomenon' | 'rootCause' | 'whyExistingProcess' | 'longTermPrinciple' | 'preventionMeasures' | 'responsiblePerson' | 'status' | 'requirementId'>>
): Promise<{ postmortem: Postmortem }> {
  return api(`/postmortems/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getPostmortemStats(): Promise<PostmortemStats> {
  return api('/postmortems/stats/summary');
}

export async function getPostmortemsByRequirement(requirementId: string): Promise<{ postmortems: Postmortem[] }> {
  return api(`/postmortems/by-requirement/${requirementId}`);
}
