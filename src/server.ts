import { WebSocketServer, WebSocket } from "ws";
import type {
  ReactotronCommand,
  ClientIntroPayload,
  ApiResponsePayload,
  StoredRequest,
} from "./types.js";
import { useStore } from "./store.js";

let messageCounter = 0;

export function startServer(port = 9090): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as ReactotronCommand;
        handleMessage(ws, message);
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

function handleMessage(ws: WebSocket, message: ReactotronCommand) {
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
      const request: StoredRequest = {
        id: messageCounter++,
        timestamp: new Date(message.date),
        method: payload.request.method,
        url: payload.request.url,
        status: payload.response.status,
        duration: payload.duration,
        request: {
          headers: payload.request.headers,
          body: payload.request.data,
        },
        response: {
          headers: payload.response.headers,
          body: payload.response.body,
        },
      };
      store.addRequest(request);
      break;
    }
  }
}
