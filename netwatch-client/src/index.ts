import type { ConnectOptions } from "./types.js";
import { NetwatchSocket } from "./ws.js";
import { patchFetch } from "./fetch.js";

export type { ConnectOptions } from "./types.js";

let socket: NetwatchSocket | null = null;
let unpatchFetch: (() => void) | null = null;

export function connect(options?: ConnectOptions): () => void {
  disconnect();

  const host = options?.host ?? "localhost";
  const port = options?.port ?? 9090;
  const name = options?.name ?? "React Native";
  const ignoredUrls = options?.ignoredUrls ?? [];
  const platform = options?.platform;

  socket = new NetwatchSocket(host, port, name, platform);

  unpatchFetch = patchFetch((msg) => {
    socket?.send(msg);
  }, ignoredUrls);

  return disconnect;
}

export function disconnect(): void {
  if (unpatchFetch) {
    unpatchFetch();
    unpatchFetch = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
