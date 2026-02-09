import type { RequestMessage } from "./types.js";

let requestCounter = 0;

export type RequestCallback = (msg: RequestMessage) => void;

function byteLength(str: string): number {
  // TextEncoder is available in RN new arch
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str).byteLength;
  }
  // Fallback: rough estimate
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) len += 1;
    else if (code <= 0x7ff) len += 2;
    else len += 3;
  }
  return len;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function patchFetch(
  callback: RequestCallback,
  ignoredUrls: string[] = [],
): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    // Check ignored URLs (substring match)
    for (const pattern of ignoredUrls) {
      if (url.includes(pattern)) {
        return originalFetch(input, init);
      }
    }

    const isRequest = input instanceof Request;
    const method = (init?.method ?? (isRequest ? input.method : "GET")).toUpperCase();
    const reqHeaders = new Headers(init?.headers ?? (isRequest ? input.headers : undefined));
    const reqBody =
      init?.body != null ? String(init.body) : null;

    const start = Date.now();

    const response = await originalFetch(input, init);

    const duration = Date.now() - start;
    const clone = response.clone();
    const resBody = await clone.text();
    const resHeaders = headersToRecord(response.headers);

    const msg: RequestMessage = {
      type: "netwatch.request",
      id: requestCounter++,
      timestamp: new Date(start).toISOString(),
      duration,
      request: {
        method,
        url,
        headers: headersToRecord(reqHeaders),
        body: reqBody,
        size: reqBody != null ? byteLength(reqBody) : 0,
      },
      response: {
        status: response.status,
        headers: resHeaders,
        body: resBody,
        size: byteLength(resBody),
      },
    };

    callback(msg);

    return response;
  };

  return function unpatch() {
    globalThis.fetch = originalFetch;
  };
}
