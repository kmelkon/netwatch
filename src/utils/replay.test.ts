import { describe, it, expect } from "vitest";
import { replayRequest } from "./replay.js";
import type { StoredRequest } from "../types.js";

describe("replayRequest", () => {
  it("returns error for invalid URL", async () => {
    const request: StoredRequest = {
      id: 1,
      timestamp: new Date(),
      method: "GET",
      url: "invalid-url",
      status: 200,
      duration: 100,
      requestSize: 50,
      responseSize: 200,
      bookmarked: false,
      request: { headers: {}, body: null },
      response: { headers: {}, body: '{}' },
    };

    const result = await replayRequest(request);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("includes duration in result", async () => {
    const request: StoredRequest = {
      id: 1,
      timestamp: new Date(),
      method: "GET",
      url: "http://localhost:9999/nonexistent",
      status: 200,
      duration: 100,
      requestSize: 50,
      responseSize: 200,
      bookmarked: false,
      request: { headers: {}, body: null },
      response: { headers: {}, body: '{}' },
    };

    const result = await replayRequest(request);
    expect(result.duration).toBeGreaterThan(0);
  });
});
