import type { StoredRequest } from "../types.js";

function escapeQuotes(str: string): string {
  return str.replace(/'/g, "'\\''");
}

export function toCurl(request: StoredRequest): string {
  const parts: string[] = [
    "curl",
    `-X ${request.method}`,
    `'${escapeQuotes(request.url)}'`,
  ];

  for (const [key, value] of Object.entries(request.request.headers)) {
    parts.push(`-H '${escapeQuotes(`${key}: ${value}`)}'`);
  }

  const methodsWithBody = ["POST", "PUT", "PATCH"];
  if (methodsWithBody.includes(request.method) && request.request.body != null) {
    const body =
      typeof request.request.body === "string"
        ? request.request.body
        : JSON.stringify(request.request.body);
    parts.push(`-d '${escapeQuotes(body)}'`);
  }

  return parts.join(" ");
}
