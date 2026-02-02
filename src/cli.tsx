#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./components/App.js";
import { startServer } from "./server.js";

// Start WebSocket server
const PORT = parseInt(process.env.NETWATCH_PORT || "9090", 10);
const wss = startServer(PORT);

// Render Ink app
const { waitUntilExit } = render(<App />);

waitUntilExit().then(() => {
  wss.close();
  process.exit(0);
});
