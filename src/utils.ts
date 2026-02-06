import Fuse from "fuse.js";
import type { StoredRequest } from "./types.js";

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
