import type { HelloMessage, RequestMessage } from "./types.js";

type NetwatchMessage = HelloMessage | RequestMessage;

const INITIAL_BACKOFF = 2000;
const MAX_BACKOFF = 30000;
const MAX_QUEUE = 50;

export class NetwatchSocket {
  private url: string;
  private name: string;
  private platform?: string;
  private ws: WebSocket | null = null;
  private queue: string[] = [];
  private backoff = INITIAL_BACKOFF;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(host: string, port: number, name: string, platform?: string) {
    this.url = `ws://${host}:${port}`;
    this.name = name;
    this.platform = platform;
    this.tryConnect();
  }

  private tryConnect() {
    if (this.closed) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.backoff = INITIAL_BACKOFF;

      const hello: HelloMessage = {
        type: "netwatch.hello",
        name: this.name,
        platform: this.platform,
      };
      this.ws!.send(JSON.stringify(hello));

      // Flush queued messages
      for (const msg of this.queue) {
        this.ws!.send(msg);
      }
      this.queue = [];
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  private scheduleReconnect() {
    if (this.closed) return;
    this.reconnectTimer = setTimeout(() => {
      this.tryConnect();
    }, this.backoff);
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF);
  }

  send(msg: NetwatchMessage) {
    const data = JSON.stringify(msg);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      if (this.queue.length < MAX_QUEUE) {
        this.queue.push(data);
      }
    }
  }

  disconnect() {
    this.closed = true;
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.queue = [];
  }
}
