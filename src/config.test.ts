import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadConfig } from "./config.js";
import * as fs from "node:fs";

vi.mock("node:fs");

describe("loadConfig", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaults when no config file exists", () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("ENOENT");
    });

    const config = loadConfig();
    expect(config).toEqual({
      port: 9090,
      ignoredUrls: [],
      maxRequests: 500,
    });
  });

  it("merges partial config with defaults", () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce(
      JSON.stringify({ port: 3000 })
    );

    const config = loadConfig();
    expect(config.port).toBe(3000);
    expect(config.maxRequests).toBe(500);
  });

  it("reads ignoredUrls", () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce(
      JSON.stringify({ ignoredUrls: ["/health", "/symbolicate"] })
    );

    const config = loadConfig();
    expect(config.ignoredUrls).toEqual(["/health", "/symbolicate"]);
  });

  it("ignores invalid types and uses defaults", () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce(
      JSON.stringify({ port: "not-a-number", maxRequests: "bad" })
    );

    const config = loadConfig();
    expect(config.port).toBe(9090);
    expect(config.maxRequests).toBe(500);
  });

  it("ignores invalid JSON", () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce("not json {{{");

    const config = loadConfig();
    expect(config).toEqual({
      port: 9090,
      ignoredUrls: [],
      maxRequests: 500,
    });
  });

  it("silently ignores legacy mode field", () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce(
      JSON.stringify({ mode: "standalone", port: 8080 })
    );

    const config = loadConfig();
    expect(config.port).toBe(8080);
    expect(config).not.toHaveProperty("mode");
  });
});
