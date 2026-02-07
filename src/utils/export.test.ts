import { describe, it, expect, vi } from "vitest";
import type { StoredRequest } from "../types.js";

vi.mock("node:fs", () => ({
  writeFileSync: vi.fn(),
}));

import { exportAsHar, exportAsJson, exportToFile } from "./export.js";
import { writeFileSync } from "node:fs";

function makeRequest(overrides: Partial<StoredRequest> = {}): StoredRequest {
  return {
    id: 1,
    timestamp: new Date("2025-01-15T12:00:00Z"),
    method: "GET",
    url: "https://api.example.com/users",
    status: 200,
    duration: 150,
    requestSize: 64,
    responseSize: 512,
    bookmarked: false,
    request: {
      headers: { "Accept": "application/json" },
      body: null,
    },
    response: {
      headers: { "Content-Type": "application/json" },
      body: '{"users":[]}',
    },
    ...overrides,
  };
}

describe("exportAsHar", () => {
  it("produces valid JSON with correct top-level structure", () => {
    const har = JSON.parse(exportAsHar([makeRequest()]));
    expect(har.log).toBeDefined();
    expect(har.log.version).toBe("1.2");
    expect(har.log.creator).toEqual({ name: "netwatch", version: "1.0.0" });
    expect(har.log.entries).toBeInstanceOf(Array);
    expect(har.log.entries).toHaveLength(1);
  });

  it("correctly maps StoredRequest fields to HAR entries", () => {
    const req = makeRequest({
      method: "POST",
      url: "https://api.example.com/data",
      status: 201,
      duration: 300,
      requestSize: 128,
      responseSize: 256,
      request: {
        headers: { "Content-Type": "application/json", "X-Token": "abc" },
        body: '{"key":"val"}',
      },
      response: {
        headers: { "X-Request-Id": "r123" },
        body: '{"id":1}',
      },
    });

    const har = JSON.parse(exportAsHar([req]));
    const entry = har.log.entries[0];

    expect(entry.time).toBe(300);
    expect(entry.startedDateTime).toBe("2025-01-15T12:00:00.000Z");

    expect(entry.request.method).toBe("POST");
    expect(entry.request.url).toBe("https://api.example.com/data");
    expect(entry.request.headers).toEqual([
      { name: "Content-Type", value: "application/json" },
      { name: "X-Token", value: "abc" },
    ]);
    expect(entry.request.bodySize).toBe(128);

    expect(entry.response.status).toBe(201);
    expect(entry.response.headers).toEqual([
      { name: "X-Request-Id", value: "r123" },
    ]);
    expect(entry.response.content.text).toBe('{"id":1}');
    expect(entry.response.content.size).toBe(256);
    expect(entry.response.bodySize).toBe(256);
  });

  it("handles multiple requests", () => {
    const requests = [makeRequest({ id: 1 }), makeRequest({ id: 2 })];
    const har = JSON.parse(exportAsHar(requests));
    expect(har.log.entries).toHaveLength(2);
  });

  it("handles timestamp as string", () => {
    const req = makeRequest({
      timestamp: "2025-06-01T08:30:00Z" as unknown as Date,
    });
    const har = JSON.parse(exportAsHar([req]));
    expect(har.log.entries[0].startedDateTime).toBe("2025-06-01T08:30:00.000Z");
  });
});

describe("exportAsJson", () => {
  it("produces valid JSON array", () => {
    const requests = [makeRequest({ id: 1 }), makeRequest({ id: 2 })];
    const parsed = JSON.parse(exportAsJson(requests));
    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe(1);
    expect(parsed[1].id).toBe(2);
  });

  it("preserves all StoredRequest fields", () => {
    const req = makeRequest();
    const parsed = JSON.parse(exportAsJson([req]));
    expect(parsed[0].method).toBe("GET");
    expect(parsed[0].url).toBe("https://api.example.com/users");
    expect(parsed[0].status).toBe(200);
  });
});

describe("exportToFile", () => {
  it("writes HAR file and returns correct path format", () => {
    vi.mocked(writeFileSync).mockImplementation(() => {});
    const filepath = exportToFile([makeRequest()], "har");
    expect(filepath).toMatch(/netwatch-export-.*\.har$/);
    expect(writeFileSync).toHaveBeenCalledWith(
      filepath,
      expect.stringContaining('"version": "1.2"'),
      "utf-8",
    );
  });

  it("writes JSON file and returns correct path format", () => {
    vi.mocked(writeFileSync).mockImplementation(() => {});
    const filepath = exportToFile([makeRequest()], "json");
    expect(filepath).toMatch(/netwatch-export-.*\.json$/);
    expect(writeFileSync).toHaveBeenCalledWith(
      filepath,
      expect.any(String),
      "utf-8",
    );
  });
});
