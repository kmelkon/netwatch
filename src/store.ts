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

const MAX_REQUESTS = 500;

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
    set((state) => {
      const requests = [request, ...state.requests].slice(0, MAX_REQUESTS);
      return {
        requests,
        filteredRequests: filterRequests(requests, state.filterText),
      };
    });
  },

  clearRequests: () => set({ requests: [], filteredRequests: [], selectedIndex: 0 }),

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
