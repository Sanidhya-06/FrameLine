import { create } from 'zustand';
import type { AnalysisMode } from '../types';

interface AppState {
  query: string;
  mode: AnalysisMode;
  selectedCountryCode: string | null;
  setQuery: (query: string) => void;
  setMode: (mode: AnalysisMode) => void;
  setSelectedCountry: (code: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  query: '',
  mode: 'framing',
  selectedCountryCode: null,
  setQuery: (query) => set({ query }),
  setMode: (mode) => set({ mode }),
  setSelectedCountry: (code) => set({ selectedCountryCode: code }),
  reset: () => set({ query: '', selectedCountryCode: null }),
}));
