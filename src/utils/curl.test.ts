import { describe, it, expect } from "vitest";
import { toCurl } from "./curl.js";
import type { StoredRequest } from "../types.js";

function makeRequest(overrides: Partial<StoredRequest> = {}): StoredRequest {
  return {
    id: 1,
    timestamp: new Date(),
    method: "GET",
    url: "https://api.example.com/users",
    status: 200,
    duration: 100,
    requestSize: 0,
    responseSize: 0,
    bookmarked: false,
    request: { headers: {}, body: null },
    response: { headers: {}, body: "{}" },
    ...overrides,
  };
}

describe("toCurl", () => {
  it("generates simple GET with no headers or body", () => {
    const result = toCurl(makeRequest());
    expect(result).toBe("curl -X GET 'https://api.example.com/users'");
  });

  it("includes -H flags for request headers", () => {
    const result = toCurl(
      makeRequest({
        request: {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer token123",
          },
          body: null,
        },
      }),
    );
    expect(result).toBe(
      "curl -X GET 'https://api.example.com/users' -H 'Content-Type: application/json' -H 'Authorization: Bearer token123'",
    );
  });

  it("includes -d flag for POST with JSON body", () => {
    const result = toCurl(
      makeRequest({
        method: "POST",
        request: {
          headers: { "Content-Type": "application/json" },
          body: { name: "test" },
        },
      }),
    );
    expect(result).toBe(
      `curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{"name":"test"}'`,
    );
  });

  it("escapes single quotes in URL", () => {
    const result = toCurl(
      makeRequest({ url: "https://api.example.com/search?q=it's" }),
    );
    expect(result).toBe(
      "curl -X GET 'https://api.example.com/search?q=it'\\''s'",
    );
  });

  it("produces no -H flags with empty headers object", () => {
    const result = toCurl(makeRequest());
    expect(result).not.toContain("-H");
  });

  it("includes -d with string body as-is", () => {
    const result = toCurl(
      makeRequest({
        method: "PUT",
        request: { headers: {}, body: "raw body text" },
      }),
    );
    expect(result).toBe(
      "curl -X PUT 'https://api.example.com/users' -d 'raw body text'",
    );
  });

  it("escapes single quotes in header values", () => {
    const result = toCurl(
      makeRequest({
        request: {
          headers: { "X-Custom": "it's a value" },
          body: null,
        },
      }),
    );
    expect(result).toContain("-H 'X-Custom: it'\\''s a value'");
  });

  it("does not include -d for GET even if body exists", () => {
    const result = toCurl(
      makeRequest({
        method: "GET",
        request: { headers: {}, body: { unexpected: true } },
      }),
    );
    expect(result).not.toContain("-d");
  });
});
