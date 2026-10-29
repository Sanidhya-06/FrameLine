import type { AnalyzeJob } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new Error(`Cannot reach the FrameLine API at ${API_URL}. Check that the backend is running.`);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail || `The analysis request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export async function startAnalysis(query: string): Promise<{ job_id: string } | AnalyzeJob> {
  return request('/analyze/jobs', { method: 'POST', body: JSON.stringify({ query }) });
}

export function getAnalysisJob(jobId: string): Promise<AnalyzeJob> {
  return request(`/analyze/jobs/${encodeURIComponent(jobId)}`);
}
