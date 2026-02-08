import { create } from "zustand";
import type { StoredRequest } from "./types.js";
import { filterRequests } from "./utils.js";

function deriveFiltered(
  requests: StoredRequest[],
  filterText: string,
  showBookmarksOnly: boolean
): StoredRequest[] {
  let result = filterRequests(requests, filterText);
  if (showBookmarksOnly) {
    result = result.filter((r) => r.bookmarked);
  }
  return result;
}

interface NetwatchState {
  connected: boolean;
  clientName: string | null;
  requests: StoredRequest[];
  filteredRequests: StoredRequest[];
  selectedIndex: number;
  filterText: string;
  filterFocused: boolean;
  paused: boolean;
  showBookmarksOnly: boolean;
  searchHistory: string[];
  showStats: boolean;
  compareMode: boolean;
  compareSelection: number | null;

  setConnected: (connected: boolean, clientName?: string | null) => void;
  addRequest: (request: StoredRequest) => void;
  clearRequests: () => void;
  setSelectedIndex: (index: number) => void;
  setFilterText: (text: string) => void;
  setFilterFocused: (focused: boolean) => void;
  togglePaused: () => void;
  toggleBookmark: (id: number) => void;
  toggleBookmarksFilter: () => void;
  addSearchHistory: (text: string) => void;
  toggleStats: () => void;
  loadSession: (requests: StoredRequest[]) => void;
  toggleCompareMode: () => void;
  setCompareSelection: (id: number | null) => void;
}

let MAX_REQUESTS = 500;

export function setMaxRequests(max: number) {
  MAX_REQUESTS = max;
}
const BATCH_INTERVAL = 100; // ms

// Batch pending requests to reduce re-renders
let pendingRequests: StoredRequest[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

function flushRequests(set: (fn: (state: NetwatchState) => Partial<NetwatchState>) => void) {
  if (pendingRequests.length === 0) return;

  const toAdd = pendingRequests;
  pendingRequests = [];
  batchTimeout = null;

  set((state) => {
    const requests = [...toAdd, ...state.requests].slice(0, MAX_REQUESTS);
    return {
      requests,
      filteredRequests: deriveFiltered(requests, state.filterText, state.showBookmarksOnly),
    };
  });
}

export const useStore = create<NetwatchState>((set, get) => ({
  connected: false,
  clientName: null,
  requests: [],
  filteredRequests: [],
  selectedIndex: 0,
  filterText: "",
  filterFocused: false,
  paused: false,
  showBookmarksOnly: false,
  searchHistory: [],
  showStats: false,
  compareMode: false,
  compareSelection: null,

  setConnected: (connected, clientName = null) =>
    set({ connected, clientName: connected ? clientName : null }),

  addRequest: (request) => {
    if (get().paused) return;

    pendingRequests.unshift(request);

    if (!batchTimeout) {
      batchTimeout = setTimeout(() => flushRequests(set), BATCH_INTERVAL);
    }
  },

  clearRequests: () => {
    pendingRequests = [];
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    set((state) => {
      const kept = state.requests.filter((r) => r.bookmarked);
      return {
        requests: kept,
        filteredRequests: deriveFiltered(kept, state.filterText, state.showBookmarksOnly),
        selectedIndex: 0,
      };
    });
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  setFilterText: (text) =>
    set((state) => ({
      filterText: text,
      filteredRequests: deriveFiltered(state.requests, text, state.showBookmarksOnly),
      selectedIndex: 0,
    })),

  setFilterFocused: (focused) => set({ filterFocused: focused }),

  togglePaused: () => set((state) => ({ paused: !state.paused })),

  toggleBookmark: (id) =>
    set((state) => {
      const requests = state.requests.map((r) =>
        r.id === id ? { ...r, bookmarked: !r.bookmarked } : r
      );
      return {
        requests,
        filteredRequests: deriveFiltered(requests, state.filterText, state.showBookmarksOnly),
      };
    }),

  toggleBookmarksFilter: () =>
    set((state) => {
      const showBookmarksOnly = !state.showBookmarksOnly;
      return {
        showBookmarksOnly,
        filteredRequests: deriveFiltered(state.requests, state.filterText, showBookmarksOnly),
      };
    }),

  addSearchHistory: (text) =>
    set((state) => {
      if (!text || state.searchHistory.includes(text)) return {};
      const searchHistory = [text, ...state.searchHistory].slice(0, 10);
      return { searchHistory };
    }),

  toggleStats: () => set((state) => ({ showStats: !state.showStats })),

  loadSession: (requests) =>
    set((state) => ({
      requests,
      filteredRequests: deriveFiltered(requests, state.filterText, state.showBookmarksOnly),
      selectedIndex: 0,
    })),

  toggleCompareMode: () =>
    set((state) => ({
      compareMode: !state.compareMode,
      compareSelection: null,
    })),

  setCompareSelection: (id) => set({ compareSelection: id }),
}));
