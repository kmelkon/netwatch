import { create } from "zustand";
import type { StoredRequest } from "./types.js";
import { filterRequests } from "./utils.js";

interface NetwatchState {
  connected: boolean;
  clientName: string | null;
  requests: StoredRequest[];
  filteredRequests: StoredRequest[];
  selectedIndex: number;
  filterText: string;
  filterFocused: boolean;
  paused: boolean;

  setConnected: (connected: boolean, clientName?: string | null) => void;
  addRequest: (request: StoredRequest) => void;
  clearRequests: () => void;
  setSelectedIndex: (index: number) => void;
  setFilterText: (text: string) => void;
  setFilterFocused: (focused: boolean) => void;
  togglePaused: () => void;
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
      filteredRequests: filterRequests(requests, state.filterText),
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
    set({ requests: [], filteredRequests: [], selectedIndex: 0 });
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  setFilterText: (text) =>
    set((state) => ({
      filterText: text,
      filteredRequests: filterRequests(state.requests, text),
      selectedIndex: 0,
    })),

  setFilterFocused: (focused) => set({ filterFocused: focused }),

  togglePaused: () => set((state) => ({ paused: !state.paused })),
}));
