import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AnalyzeJob, AnalyzeResponse } from '../types';

interface AppState {
  query: string;
  jobId: string | null;
  job: AnalyzeJob | null;
  result: AnalyzeResponse | null;
  error: string | null;
  setQuery: (query: string) => void;
  setJobId: (jobId: string | null) => void;
  setJob: (job: AnalyzeJob) => void;
  setResult: (result: AnalyzeResponse | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  query: '', jobId: null, job: null, result: null, error: null,
  setQuery: (query) => set((state) => query === state.query ? { query } : { query, jobId: null, job: null, result: null, error: null }),
  setJobId: (jobId) => set({ jobId }),
  setJob: (job) => set({ job, jobId: job.job_id, result: job.result, error: job.error }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  reset: () => set({ query: '', jobId: null, job: null, result: null, error: null }),
}), { name: 'frameline-app', storage: createJSONStorage(() => sessionStorage), partialize: (state) => ({ query: state.query, result: state.result, job: state.job, jobId: state.jobId, error: state.error }) }));
