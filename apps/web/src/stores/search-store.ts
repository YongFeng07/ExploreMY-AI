import { create } from 'zustand';
interface SearchState { query: string; results: any[]; isSearching: boolean; setQuery: (q: string) => void; setResults: (r: any[]) => void; setSearching: (v: boolean) => void; }
export const useSearchStore = create<SearchState>(set => ({ query: '', results: [], isSearching: false, setQuery: q => set({ query: q }), setResults: r => set({ results: r }), setSearching: v => set({ isSearching: v }) }));
