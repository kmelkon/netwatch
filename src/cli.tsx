#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./components/App.js";
import { startServer } from "./server.js";

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

// Enable SGR extended mouse mode for scroll wheel support
// Unsupported terminals safely ignore these sequences
const MOUSE_ENABLE = "\x1b[?1006h";
const MOUSE_DISABLE = "\x1b[?1006l";
originalWrite(MOUSE_ENABLE);

const cleanup = () => {
  originalWrite(MOUSE_DISABLE);
};
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Start WebSocket server
const PORT = parseInt(process.env.NETWATCH_PORT || "9090", 10);
const wss = startServer(PORT);

// Render Ink app
const { waitUntilExit } = render(<App />, {
  incrementalRendering: true,
  maxFps: 20,
});

waitUntilExit().then(() => {
  cleanup();
  wss.close();
  process.exit(0);
});
