import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { StoredRequest } from "../types.js";

const SESSION_DIR = join(homedir(), ".netwatch");
const SESSION_FILE = join(SESSION_DIR, "session.json");

interface SerializableRequest {
  id: number;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  bookmarked: boolean;
  request: {
    headers: Record<string, string>;
    body: unknown;
  };
  response: {
    headers: Record<string, string>;
    body: string;
  };
}

interface Session {
  version: string;
  timestamp: string;
  requests: SerializableRequest[];
}

export function saveSession(requests: StoredRequest[]): boolean {
  try {
    if (!existsSync(SESSION_DIR)) {
      mkdirSync(SESSION_DIR, { recursive: true });
    }

    const session: Session = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      requests: requests.map((r) => ({
        ...r,
        timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
      })),
    };

    writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

export function loadSession(): StoredRequest[] | null {
  try {
    if (!existsSync(SESSION_FILE)) {
      return null;
    }

    const content = readFileSync(SESSION_FILE, "utf-8");
    const session = JSON.parse(content) as Session;

    return session.requests.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }));
  } catch {
    return null;
  }
}

export function hasSession(): boolean {
  return existsSync(SESSION_FILE);
}
