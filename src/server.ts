import { WebSocketServer, WebSocket } from "ws";
import type {
  ReactotronCommand,
  ClientIntroPayload,
  ApiResponsePayload,
  NetwatchHelloMessage,
  NetwatchRequestMessage,
  StoredRequest,
} from "./types.js";
import { useStore } from "./store.js";
import { matchesIgnoredUrl } from "./utils.js";

let messageCounter = 0;
const identifiedClients = new Set<WebSocket>();

export function getIdentifiedClientCount(): number {
  return identifiedClients.size;
}

export function clearIdentifiedClients(): void {
  identifiedClients.clear();
}

export function removeIdentifiedClient(ws: WebSocket): void {
  identifiedClients.delete(ws);
  if (identifiedClients.size === 0) {
    useStore.getState().setConnected(false);
  }
}

export function computeBodySize(body: unknown): number {
  if (body === null || body === undefined) return 0;
  if (typeof body === "string") return Buffer.byteLength(body, "utf-8");
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf-8");
  } catch {
    return 0;
  }
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
        const message = JSON.parse(data.toString());
        handleMessage(ws, message, ignoredUrls);
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      removeIdentifiedClient(ws);
    });
  });

  return wss;
}

function handleMessage(ws: WebSocket, message: { type?: string; [key: string]: unknown }, ignoredUrls: string[]) {
  const type = message.type;
  if (typeof type === "string" && type.startsWith("netwatch.")) {
    handleNetwatchMessage(ws, message, ignoredUrls);
  } else {
    handleReactotronMessage(ws, message as unknown as ReactotronCommand, ignoredUrls);
  }
}

export function handleNetwatchMessage(ws: WebSocket, message: { type?: string; [key: string]: unknown }, ignoredUrls: string[]) {
  const store = useStore.getState();

  switch (message.type) {
    case "netwatch.hello": {
      const msg = message as unknown as NetwatchHelloMessage;
      identifiedClients.add(ws);
      store.setConnected(true, msg.name);
      ws.send(JSON.stringify({ type: "netwatch.welcome" }));
      break;
    }

    case "netwatch.request": {
      const msg = message as unknown as NetwatchRequestMessage;
      if (matchesIgnoredUrl(msg.request.url, ignoredUrls)) break;

      const request: StoredRequest = {
        id: messageCounter++,
        timestamp: new Date(msg.timestamp),
        method: msg.request.method,
        url: msg.request.url,
        status: msg.response.status,
        duration: msg.duration,
        requestSize: msg.request.size,
        responseSize: msg.response.size,
        bookmarked: false,
        request: {
          headers: msg.request.headers,
          body: msg.request.body,
        },
        response: {
          headers: msg.response.headers,
          body: msg.response.body,
        },
      };
      store.addRequest(request);
      break;
    }
  }
}

function handleReactotronMessage(ws: WebSocket, message: ReactotronCommand, ignoredUrls: string[]) {
  const store = useStore.getState();

  switch (message.type) {
    case "client.intro": {
      const payload = message.payload as ClientIntroPayload;
      identifiedClients.add(ws);
      store.setConnected(true, payload.name);

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
