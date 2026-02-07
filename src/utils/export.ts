import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { StoredRequest } from "../types.js";

export function exportAsHar(requests: StoredRequest[]): string {
  const har = {
    log: {
      version: "1.2",
      creator: { name: "netwatch", version: "1.0.0" },
      entries: requests.map((r) => ({
        startedDateTime:
          r.timestamp instanceof Date
            ? r.timestamp.toISOString()
            : new Date(r.timestamp).toISOString(),
        time: r.duration,
        request: {
          method: r.method,
          url: r.url,
          headers: Object.entries(r.request.headers).map(([name, value]) => ({
            name,
            value,
          })),
          bodySize: r.requestSize,
        },
        response: {
          status: r.status,
          headers: Object.entries(r.response.headers).map(([name, value]) => ({
            name,
            value,
          })),
          content: {
            size: r.responseSize,
            text: r.response.body,
          },
          bodySize: r.responseSize,
        },
      })),
    },
  };
  return JSON.stringify(har, null, 2);
}

export function exportAsJson(requests: StoredRequest[]): string {
  return JSON.stringify(requests, null, 2);
}

export function exportToFile(
  requests: StoredRequest[],
  format: "har" | "json",
): string {
  const content =
    format === "har" ? exportAsHar(requests) : exportAsJson(requests);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const ext = format === "har" ? "har" : "json";
  const filename = `netwatch-export-${timestamp}.${ext}`;
  const filepath = join(homedir(), filename);
  writeFileSync(filepath, content, "utf-8");
  return filepath;
}
