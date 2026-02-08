import { describe, it, expect, beforeEach } from "vitest";
import { saveSession, loadSession, hasSession } from "./session.js";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { StoredRequest } from "../types.js";

const SESSION_FILE = join(homedir(), ".netwatch", "session.json");

describe("session utils", () => {
  beforeEach(() => {
    // Clean up before each test
    if (existsSync(SESSION_FILE)) {
      unlinkSync(SESSION_FILE);
    }
  });

  describe("saveSession", () => {
    it("saves requests to session file", () => {
      const requests: StoredRequest[] = [
        {
          id: 1,
          timestamp: new Date("2024-01-01T00:00:00Z"),
          method: "GET",
          url: "https://api.example.com/users",
          status: 200,
          duration: 150,
          requestSize: 100,
          responseSize: 500,
          bookmarked: false,
          request: { headers: {}, body: null },
          response: { headers: {}, body: '{"users":[]}' },
        },
      ];

      const result = saveSession(requests);
      expect(result).toBe(true);
      expect(existsSync(SESSION_FILE)).toBe(true);
    });

    it("returns false on error", () => {
      // Test with invalid data that would cause an error
      const result = saveSession(null as any);
      expect(result).toBe(false);
    });
  });

  describe("loadSession", () => {
    it("loads requests from session file", () => {
      const requests: StoredRequest[] = [
        {
          id: 1,
          timestamp: new Date("2024-01-01T00:00:00Z"),
          method: "GET",
          url: "https://api.example.com/users",
          status: 200,
          duration: 150,
          requestSize: 100,
          responseSize: 500,
          bookmarked: true,
          request: { headers: {}, body: null },
          response: { headers: {}, body: '{"users":[]}' },
        },
      ];

      saveSession(requests);
      const loaded = loadSession();

      expect(loaded).toBeTruthy();
      expect(loaded).toHaveLength(1);
      expect(loaded![0].id).toBe(1);
      expect(loaded![0].method).toBe("GET");
      expect(loaded![0].bookmarked).toBe(true);
      expect(loaded![0].timestamp).toBeInstanceOf(Date);
    });

    it("returns null when no session file exists", () => {
      const loaded = loadSession();
      expect(loaded).toBeNull();
    });
  });

  describe("hasSession", () => {
    it("returns true when session exists", () => {
      const requests: StoredRequest[] = [
        {
          id: 1,
          timestamp: new Date(),
          method: "GET",
          url: "https://api.example.com/test",
          status: 200,
          duration: 100,
          requestSize: 50,
          responseSize: 200,
          bookmarked: false,
          request: { headers: {}, body: null },
          response: { headers: {}, body: '{}' },
        },
      ];

      saveSession(requests);
      expect(hasSession()).toBe(true);
    });

    it("returns false when no session exists", () => {
      expect(hasSession()).toBe(false);
    });
  });
});
