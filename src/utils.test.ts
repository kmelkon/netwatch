import { describe, it, expect } from "vitest";
import { filterRequests, formatBytes, matchesIgnoredUrl } from "./utils.js";
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
    responseSize: 2,
    bookmarked: false,
    request: { headers: {}, body: null },
    response: { headers: {}, body: "{}" },
    ...overrides,
  };
}

describe("filterRequests", () => {
  it("returns all requests when filter is empty", () => {
    const requests = [makeRequest({ id: 1 }), makeRequest({ id: 2 })];
    expect(filterRequests(requests, "")).toBe(requests);
  });

  it("filters by URL", () => {
    const requests = [
      makeRequest({ id: 1, url: "https://api.example.com/users" }),
      makeRequest({ id: 2, url: "https://api.example.com/posts" }),
    ];
    const result = filterRequests(requests, "users");
    expect(result).toHaveLength(1);
    expect(result[0]!.url).toContain("users");
  });

  it("filters by method", () => {
    const requests = [
      makeRequest({ id: 1, method: "GET" }),
      makeRequest({ id: 2, method: "POST" }),
    ];
    const result = filterRequests(requests, "POST");
    expect(result).toHaveLength(1);
    expect(result[0]!.method).toBe("POST");
  });

  it("returns empty for no matches", () => {
    const requests = [makeRequest({ id: 1, url: "https://api.example.com/users" })];
    const result = filterRequests(requests, "zzzzzzzzz");
    expect(result).toHaveLength(0);
  });
});

describe("matchesIgnoredUrl", () => {
  it("returns false for empty patterns", () => {
    expect(matchesIgnoredUrl("https://api.example.com/users", [])).toBe(false);
  });

  it("matches by substring (case-insensitive)", () => {
    expect(matchesIgnoredUrl("https://api.example.com/symbolicate", ["symbolicate"])).toBe(true);
    expect(matchesIgnoredUrl("https://api.example.com/Symbolicate", ["symbolicate"])).toBe(true);
    expect(matchesIgnoredUrl("https://api.example.com/users", ["symbolicate"])).toBe(false);
  });

  it("matches by glob pattern", () => {
    expect(matchesIgnoredUrl("https://api.example.com/index.bundle", ["*.bundle"])).toBe(true);
    expect(matchesIgnoredUrl("https://api.example.com/index.json", ["*.bundle"])).toBe(false);
    expect(matchesIgnoredUrl("https://api.example.com/v1/users", ["*/v1/*"])).toBe(true);
  });

  it("matches by regex pattern", () => {
    expect(matchesIgnoredUrl("https://api.example.com/symbolicate", ["/symbolicate/"])).toBe(true);
    expect(matchesIgnoredUrl("https://api.example.com/users", ["/symbolicate/"])).toBe(false);
    expect(matchesIgnoredUrl("https://api.example.com/v1/users", ["/\\/v\\d+\\//"])).toBe(true);
  });

  it("matches if any pattern matches", () => {
    expect(matchesIgnoredUrl("https://api.example.com/health", ["symbolicate", "health"])).toBe(true);
  });
});

describe("formatBytes", () => {
  it("returns 0B for zero", () => {
    expect(formatBytes(0)).toBe("0B");
  });

  it("returns bytes for small values", () => {
    expect(formatBytes(512)).toBe("512B");
    expect(formatBytes(1023)).toBe("1023B");
  });

  it("returns KB for kilobyte range", () => {
    expect(formatBytes(1024)).toBe("1.0KB");
    expect(formatBytes(1536)).toBe("1.5KB");
    expect(formatBytes(10240)).toBe("10.0KB");
  });

  it("returns MB for megabyte range", () => {
    expect(formatBytes(1048576)).toBe("1.0MB");
    expect(formatBytes(2621440)).toBe("2.5MB");
    expect(formatBytes(10485760)).toBe("10.0MB");
  });
});
