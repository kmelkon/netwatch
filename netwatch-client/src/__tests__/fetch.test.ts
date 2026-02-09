import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { patchFetch } from "../fetch.js";
import type { RequestMessage } from "../types.js";

const mockResponse = (body: string, status = 200, headers: Record<string, string> = {}) => {
  const h = new Headers(headers);
  return new Response(body, { status, headers: h });
};

describe("patchFetch", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = vi.fn() as unknown as typeof globalThis.fetch;
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("captures method, url, headers, body, status, duration", async () => {
    const captured: RequestMessage[] = [];
    vi.mocked(originalFetch).mockResolvedValue(
      mockResponse('{"ok":true}', 200, { "content-type": "application/json" }),
    );

    const unpatch = patchFetch((msg) => captured.push(msg), []);

    await globalThis.fetch("https://api.example.com/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });

    expect(captured).toHaveLength(1);
    const msg = captured[0];
    expect(msg.type).toBe("netwatch.request");
    expect(msg.request.method).toBe("POST");
    expect(msg.request.url).toBe("https://api.example.com/users");
    expect(msg.request.headers["content-type"]).toBe("application/json");
    expect(msg.request.body).toBe('{"name":"test"}');
    expect(msg.response.status).toBe(200);
    expect(msg.response.body).toBe('{"ok":true}');
    expect(msg.duration).toBeGreaterThanOrEqual(0);
    expect(msg.timestamp).toBeTruthy();

    unpatch();
  });

  it("defaults method to GET", async () => {
    const captured: RequestMessage[] = [];
    vi.mocked(originalFetch).mockResolvedValue(mockResponse("ok"));

    const unpatch = patchFetch((msg) => captured.push(msg), []);
    await globalThis.fetch("https://api.example.com/data");

    expect(captured[0].request.method).toBe("GET");
    expect(captured[0].request.body).toBeNull();

    unpatch();
  });

  it("skips ignored URLs (substring match)", async () => {
    const captured: RequestMessage[] = [];
    vi.mocked(originalFetch).mockResolvedValue(mockResponse("ok"));

    const unpatch = patchFetch((msg) => captured.push(msg), ["/health", "symbolicate"]);

    await globalThis.fetch("https://api.example.com/health");
    await globalThis.fetch("https://api.example.com/symbolicate?foo=1");
    await globalThis.fetch("https://api.example.com/users");

    expect(captured).toHaveLength(1);
    expect(captured[0].request.url).toBe("https://api.example.com/users");

    unpatch();
  });

  it("returns original response transparently", async () => {
    const original = mockResponse("response body", 201);
    vi.mocked(originalFetch).mockResolvedValue(original);

    const unpatch = patchFetch(() => {}, []);
    const result = await globalThis.fetch("https://api.example.com/create");

    expect(result).toBe(original);
    expect(result.status).toBe(201);

    unpatch();
  });

  it("restores original fetch on unpatch", async () => {
    const unpatch = patchFetch(() => {}, []);
    expect(globalThis.fetch).not.toBe(originalFetch);

    unpatch();
    expect(globalThis.fetch).toBe(originalFetch);
  });

  it("computes request and response sizes", async () => {
    const captured: RequestMessage[] = [];
    vi.mocked(originalFetch).mockResolvedValue(mockResponse("hello"));

    const unpatch = patchFetch((msg) => captured.push(msg), []);
    await globalThis.fetch("https://api.example.com/data", {
      method: "POST",
      body: "req",
    });

    expect(captured[0].request.size).toBe(3); // "req"
    expect(captured[0].response.size).toBe(5); // "hello"

    unpatch();
  });

  it("handles URL input as URL object", async () => {
    const captured: RequestMessage[] = [];
    vi.mocked(originalFetch).mockResolvedValue(mockResponse("ok"));

    const unpatch = patchFetch((msg) => captured.push(msg), []);
    await globalThis.fetch(new URL("https://api.example.com/path"));

    expect(captured[0].request.url).toBe("https://api.example.com/path");

    unpatch();
  });
});
