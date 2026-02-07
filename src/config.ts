import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface NetwatchConfig {
  port: number;
  mode: "reactotron" | "standalone";
  ignoredUrls: string[];
  maxRequests: number;
}

const DEFAULTS: NetwatchConfig = {
  port: 9090,
  mode: "reactotron",
  ignoredUrls: [],
  maxRequests: 500,
};

function tryReadJson(path: string): Record<string, unknown> | null {
  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function loadConfig(): NetwatchConfig {
  // Check cwd first, then home directory
  const localConfig = tryReadJson(join(process.cwd(), ".netwatchrc"));
  const homeConfig = tryReadJson(join(homedir(), ".netwatchrc"));

  const fileConfig = localConfig ?? homeConfig ?? {};

  return {
    port: typeof fileConfig.port === "number" ? fileConfig.port : DEFAULTS.port,
    mode: fileConfig.mode === "standalone" ? "standalone" : DEFAULTS.mode,
    ignoredUrls: Array.isArray(fileConfig.ignoredUrls) ? fileConfig.ignoredUrls : DEFAULTS.ignoredUrls,
    maxRequests: typeof fileConfig.maxRequests === "number" ? fileConfig.maxRequests : DEFAULTS.maxRequests,
  };
}
