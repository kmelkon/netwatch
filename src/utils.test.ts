import { describe, it, expect } from "vitest";
import { filterRequests } from "./utils.js";
import type { StoredRequest } from "./types.js";

function makeRequest(overrides: Partial<StoredRequest> = {}): StoredRequest {
  return {
    id: 1,
    timestamp: new Date(),
    method: "GET",
    url: "https://api.example.com/users",
    status: 200,
    duration: 100,
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
