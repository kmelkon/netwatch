import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./store.js";
import type { StoredRequest } from "./types.js";

function makeRequest(overrides: Partial<StoredRequest> = {}): StoredRequest {
  return {
    id: 1,
    timestamp: new Date(),
    method: "GET",
    url: "https://api.example.com/users",
    status: 200,
    duration: 100,
    requestSize: 0,
    responseSize: 128,
    bookmarked: false,
    request: { headers: {}, body: null },
    response: { headers: {}, body: "{}" },
    ...overrides,
  };
}

describe("store", () => {
  beforeEach(() => {
    useStore.setState({
      requests: [],
      filteredRequests: [],
      filterText: "",
      selectedIndex: 0,
      showBookmarksOnly: false,
    });
  });

  describe("toggleBookmark", () => {
    it("flips bookmarked flag on the correct request", () => {
      const r1 = makeRequest({ id: 1 });
      const r2 = makeRequest({ id: 2 });
      useStore.setState({ requests: [r1, r2], filteredRequests: [r1, r2] });

      useStore.getState().toggleBookmark(1);

      const state = useStore.getState();
      expect(state.requests.find((r) => r.id === 1)!.bookmarked).toBe(true);
      expect(state.requests.find((r) => r.id === 2)!.bookmarked).toBe(false);
    });

    it("toggles bookmark off when called again", () => {
      const r1 = makeRequest({ id: 1, bookmarked: true });
      useStore.setState({ requests: [r1], filteredRequests: [r1] });

      useStore.getState().toggleBookmark(1);

      expect(useStore.getState().requests[0]!.bookmarked).toBe(false);
    });

    it("updates filteredRequests to reflect bookmark change", () => {
      const r1 = makeRequest({ id: 1 });
      useStore.setState({ requests: [r1], filteredRequests: [r1] });

      useStore.getState().toggleBookmark(1);

      expect(useStore.getState().filteredRequests[0]!.bookmarked).toBe(true);
    });
  });

  describe("clearRequests", () => {
    it("preserves bookmarked requests", () => {
      const r1 = makeRequest({ id: 1, bookmarked: true });
      const r2 = makeRequest({ id: 2, bookmarked: false });
      const r3 = makeRequest({ id: 3, bookmarked: true });
      useStore.setState({ requests: [r1, r2, r3], filteredRequests: [r1, r2, r3] });

      useStore.getState().clearRequests();

      const state = useStore.getState();
      expect(state.requests).toHaveLength(2);
      expect(state.requests.map((r) => r.id)).toEqual([1, 3]);
    });

    it("clears all when none are bookmarked", () => {
      const r1 = makeRequest({ id: 1 });
      const r2 = makeRequest({ id: 2 });
      useStore.setState({ requests: [r1, r2], filteredRequests: [r1, r2] });

      useStore.getState().clearRequests();

      expect(useStore.getState().requests).toHaveLength(0);
    });
  });

  describe("showBookmarksOnly", () => {
    it("filters to only bookmarked requests when enabled", () => {
      const r1 = makeRequest({ id: 1, bookmarked: true });
      const r2 = makeRequest({ id: 2, bookmarked: false });
      useStore.setState({ requests: [r1, r2], filteredRequests: [r1, r2] });

      useStore.getState().toggleBookmarksFilter();

      const state = useStore.getState();
      expect(state.showBookmarksOnly).toBe(true);
      expect(state.filteredRequests).toHaveLength(1);
      expect(state.filteredRequests[0]!.id).toBe(1);
    });

    it("shows all requests when toggled off", () => {
      const r1 = makeRequest({ id: 1, bookmarked: true });
      const r2 = makeRequest({ id: 2, bookmarked: false });
      useStore.setState({
        requests: [r1, r2],
        filteredRequests: [r1],
        showBookmarksOnly: true,
      });

      useStore.getState().toggleBookmarksFilter();

      const state = useStore.getState();
      expect(state.showBookmarksOnly).toBe(false);
      expect(state.filteredRequests).toHaveLength(2);
    });
  });

  describe("text filter + bookmark filter combination", () => {
    it("applies both filters together", () => {
      const r1 = makeRequest({ id: 1, bookmarked: true, url: "https://api.example.com/users" });
      const r2 = makeRequest({ id: 2, bookmarked: true, url: "https://api.example.com/posts" });
      const r3 = makeRequest({ id: 3, bookmarked: false, url: "https://api.example.com/users" });
      useStore.setState({
        requests: [r1, r2, r3],
        filteredRequests: [r1, r2, r3],
        showBookmarksOnly: true,
      });

      useStore.getState().setFilterText("users");

      const state = useStore.getState();
      // Should only match r1: bookmarked + matches "users"
      expect(state.filteredRequests).toHaveLength(1);
      expect(state.filteredRequests[0]!.id).toBe(1);
    });
  });
});
