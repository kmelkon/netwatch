import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeBodySize, handleNetwatchMessage, clearIdentifiedClients, getIdentifiedClientCount, removeIdentifiedClient } from "./server.js";
import { useStore } from "./store.js";

describe("computeBodySize", () => {
  it("returns 0 for null", () => {
    expect(computeBodySize(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(computeBodySize(undefined)).toBe(0);
  });

  it("computes size for string body", () => {
    expect(computeBodySize("hello")).toBe(5);
  });

  it("computes size for UTF-8 string", () => {
    expect(computeBodySize("héllo")).toBe(6);
  });

  it("computes size for object body (serialized)", () => {
    const body = { name: "test", value: 42 };
    const expected = Buffer.byteLength(JSON.stringify(body), "utf-8");
    expect(computeBodySize(body)).toBe(expected);
  });

  it("computes size for empty string", () => {
    expect(computeBodySize("")).toBe(0);
  });

  it("computes size for array body", () => {
    const body = [1, 2, 3];
    expect(computeBodySize(body)).toBe(Buffer.byteLength("[1,2,3]", "utf-8"));
  });

  it("returns 0 for circular reference", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(computeBodySize(obj)).toBe(0);
  });

  it("returns 0 for BigInt value", () => {
    expect(computeBodySize({ n: BigInt(123) })).toBe(0);
  });
});

describe("handleNetwatchMessage", () => {
  const mockWs = {
    send: vi.fn(),
  } as unknown as import("ws").WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    clearIdentifiedClients();
    const store = useStore.getState();
    store.setConnected(false);
    store.clearRequests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles netwatch.hello — sets connected and responds with welcome", () => {
    handleNetwatchMessage(mockWs, {
      type: "netwatch.hello",
      name: "MyApp",
      platform: "ios",
    }, []);

    const store = useStore.getState();
    expect(store.connected).toBe(true);
    expect(store.clientName).toBe("MyApp");
    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "netwatch.welcome" }),
    );
  });

  it("handles netwatch.request — creates StoredRequest", () => {
    handleNetwatchMessage(mockWs, {
      type: "netwatch.request",
      id: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
      duration: 150,
      request: {
        method: "GET",
        url: "https://api.example.com/users",
        headers: { accept: "application/json" },
        body: null,
        size: 0,
      },
      response: {
        status: 200,
        headers: { "content-type": "application/json" },
        body: '{"users":[]}',
        size: 12,
      },
    }, []);

    // Flush the 100ms batch timer
    vi.advanceTimersByTime(100);

    const store = useStore.getState();
    expect(store.requests).toHaveLength(1);

    const req = store.requests[0];
    expect(req.method).toBe("GET");
    expect(req.url).toBe("https://api.example.com/users");
    expect(req.status).toBe(200);
    expect(req.duration).toBe(150);
    expect(req.requestSize).toBe(0);
    expect(req.responseSize).toBe(12);
    expect(req.response.body).toBe('{"users":[]}');
  });

  it("skips ignored URLs in netwatch.request", () => {
    handleNetwatchMessage(mockWs, {
      type: "netwatch.request",
      id: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
      duration: 10,
      request: {
        method: "GET",
        url: "https://api.example.com/health",
        headers: {},
        body: null,
        size: 0,
      },
      response: {
        status: 200,
        headers: {},
        body: "ok",
        size: 2,
      },
    }, ["/health"]);

    const store = useStore.getState();
    expect(store.requests).toHaveLength(0);
  });

  it("tracks identified clients — stays connected until all disconnect", () => {
    const ws1 = { send: vi.fn() } as unknown as import("ws").WebSocket;
    const ws2 = { send: vi.fn() } as unknown as import("ws").WebSocket;

    // Two clients connect
    handleNetwatchMessage(ws1, { type: "netwatch.hello", name: "App1", platform: "ios" }, []);
    handleNetwatchMessage(ws2, { type: "netwatch.hello", name: "App2", platform: "android" }, []);
    expect(getIdentifiedClientCount()).toBe(2);
    expect(useStore.getState().connected).toBe(true);

    // First client disconnects — simulate close handler via exported helpers
    removeIdentifiedClient(ws1);
    expect(useStore.getState().connected).toBe(true);
    expect(getIdentifiedClientCount()).toBe(1);

    // Second client disconnects — now disconnected
    removeIdentifiedClient(ws2);
    expect(useStore.getState().connected).toBe(false);
    expect(getIdentifiedClientCount()).toBe(0);
  });
});
