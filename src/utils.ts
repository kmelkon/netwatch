import Fuse from "fuse.js";
import type { StoredRequest } from "./types.js";

export function matchesIgnoredUrl(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Regex: /pattern/
    if (pattern.startsWith("/") && pattern.endsWith("/") && pattern.length > 2) {
      return new RegExp(pattern.slice(1, -1)).test(url);
    }
    // Glob: contains * or ?
    if (pattern.includes("*") || pattern.includes("?")) {
      const re = new RegExp(
        "^" +
          pattern
            .replace(/[.+^${}()|[\]\\]/g, "\\$&")
            .replace(/\*/g, ".*")
            .replace(/\?/g, ".") +
          "$",
      );
      return re.test(url);
    }
    // Substring: case-insensitive
    return url.toLowerCase().includes(pattern.toLowerCase());
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

let cachedFuse: Fuse<StoredRequest> | null = null;
let cachedRequests: StoredRequest[] | null = null;

export function filterRequests(
  requests: StoredRequest[],
  filterText: string
): StoredRequest[] {
  if (!filterText) return requests;

  if (requests !== cachedRequests) {
    cachedFuse = new Fuse(requests, {
      keys: ["url", "method", "status"],
      threshold: 0.4,
    });
    cachedRequests = requests;
  }
  return cachedFuse!.search(filterText).map((r) => r.item);
}
