import React from "react";
import { render } from "ink";
import { App } from "./components/App.js";
import { startServer } from "./server.js";
import { loadConfig } from "./config.js";
import { setMaxRequests, setPort } from "./store.js";

// Wrap stdout.write with Synchronized Output escape sequences
// Terminals that support it (iTerm2, kitty, WezTerm, etc.) will buffer
// all output between BSU/ESU and render as a single atomic frame.
// Unsupported terminals safely ignore these sequences.
const BSU = "\x1b[?2026h";
const ESU = "\x1b[?2026l";
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = function (
  chunk: string | Uint8Array,
  ...args: unknown[]
) {
  if (typeof chunk === "string" && chunk.includes("\x1b[")) {
    return originalWrite(BSU + chunk + ESU, ...(args as []));
  }
  return originalWrite(chunk, ...(args as []));
} as typeof process.stdout.write;

// Mouse mode enable/disable sequences
// \x1b[?1003h = any-event tracking (press + release + scroll + motion/hover)
// \x1b[?1006h = use SGR encoding for coordinates (modern, supports large terminals)
const MOUSE_ENABLE = "\x1b[?1003h\x1b[?1006h";
const MOUSE_DISABLE = "\x1b[?1006l\x1b[?1003l";

const cleanup = () => {
  originalWrite(MOUSE_DISABLE);
};
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Load config
const config = loadConfig();
setMaxRequests(config.maxRequests);
// Start WebSocket server
const PORT = parseInt(process.env.NETWATCH_PORT || String(config.port), 10);
setPort(PORT);
const wss = startServer(PORT, config.ignoredUrls);

// Render Ink app
const { waitUntilExit } = render(<App />, {
  incrementalRendering: true,
  maxFps: 20,
});

// Enable mouse AFTER Ink starts (needs raw mode active on stdin)
originalWrite(MOUSE_ENABLE);

waitUntilExit().then(() => {
  cleanup();
  wss.close();
  process.exit(0);
});
