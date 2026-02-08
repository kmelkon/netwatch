import { WebSocketServer, WebSocket } from "ws";
import type {
  ReactotronCommand,
  ClientIntroPayload,
  ApiResponsePayload,
  StoredRequest,
} from "./types.js";
import { useStore } from "./store.js";
import { matchesIgnoredUrl } from "./utils.js";

let messageCounter = 0;

export function computeBodySize(body: unknown): number {
  if (body === null || body === undefined) return 0;
  if (typeof body === "string") return Buffer.byteLength(body, "utf-8");
  return Buffer.byteLength(JSON.stringify(body), "utf-8");
}

export function startServer(port = 9090, ignoredUrls: string[] = []): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Error: Port ${port} is already in use. Set a different port in .netwatchrc or NETWATCH_PORT env var.`);
    } else {
      console.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as ReactotronCommand;
        handleMessage(ws, message, ignoredUrls);
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      useStore.getState().setConnected(false);
    });
  });

  return wss;
}

function handleMessage(ws: WebSocket, message: ReactotronCommand, ignoredUrls: string[]) {
  const store = useStore.getState();

  switch (message.type) {
    case "client.intro": {
      const payload = message.payload as ClientIntroPayload;
      store.setConnected(true, payload.name);

      // Respond with server intro
      const response = {
        type: "server.intro",
        messageId: messageCounter++,
        date: new Date(),
      };
      ws.send(JSON.stringify(response));
      break;
    }

    case "api.response": {
      const payload = message.payload as ApiResponsePayload;
      if (matchesIgnoredUrl(payload.request.url, ignoredUrls)) break;
      const requestBody = payload.request.data;
      const responseBody = payload.response.body;
      const request: StoredRequest = {
        id: messageCounter++,
        timestamp: new Date(message.date),
        method: payload.request.method,
        url: payload.request.url,
        status: payload.response.status,
        duration: payload.duration,
        requestSize: computeBodySize(requestBody),
        responseSize: computeBodySize(responseBody),
        bookmarked: false,
        request: {
          headers: payload.request.headers,
          body: requestBody,
        },
        response: {
          headers: payload.response.headers,
          body: responseBody,
        },
      };
      store.addRequest(request);
      break;
    }
  }
}
