import type { StoredRequest } from "../types.js";

export interface ReplayResult {
  success: boolean;
  status?: number;
  duration?: number;
  response?: string;
  error?: string;
}

export async function replayRequest(request: StoredRequest): Promise<ReplayResult> {
  const startTime = Date.now();

  try {
    const headers = new Headers();
    Object.entries(request.request.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });

    const options: RequestInit = {
      method: request.method,
      headers,
    };

    // Add body for methods that support it
    const methodsWithBody = ["POST", "PUT", "PATCH"];
    if (methodsWithBody.includes(request.method) && request.request.body != null) {
      options.body =
        typeof request.request.body === "string"
          ? request.request.body
          : JSON.stringify(request.request.body);
    }

    const response = await fetch(request.url, options);
    const duration = Date.now() - startTime;
    const responseText = await response.text();

    return {
      success: true,
      status: response.status,
      duration,
      response: responseText,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}
