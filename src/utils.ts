import Fuse from "fuse.js";
import type { StoredRequest } from "./types.js";

export function filterRequests(
  requests: StoredRequest[],
  filterText: string
): StoredRequest[] {
  if (!filterText) return requests;

  const fuse = new Fuse(requests, {
    keys: ["url", "method", "status"],
    threshold: 0.4,
  });
  return fuse.search(filterText).map((r) => r.item);
}
