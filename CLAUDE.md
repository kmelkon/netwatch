# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start              # Run server (tsx src/cli.tsx)
npm run dev            # Watch mode (tsx watch src/cli.tsx)

# Testing
npm test               # Run all server tests (vitest)
npm test:watch         # Watch mode
npx vitest run src/__tests__/store.test.ts  # Single test file

# Client tests (separate package)
cd netwatch-client && npm test

# Build
npm run build          # esbuild → dist/cli.js (CLI binary with shebang)

# Install (always use public registry for personal projects)
npm install --registry https://registry.npmjs.org/
```

## Architecture

**Monorepo with two packages:**

- **Root (`netwatch`)** — Terminal TUI server. Ink (React for terminals) + Zustand state + WebSocket server.
- **`netwatch-client/`** — Zero-dependency RN client. Patches `globalThis.fetch`, sends data over WebSocket with auto-reconnect.

### Server flow

`src/cli.tsx` (entry) → wraps stdout with synchronized output sequences → loads `.netwatchrc` config → starts WebSocket server (`src/server.ts`) → renders Ink app at 20fps with incremental rendering.

### Key modules

- **`src/server.ts`** — Dual-protocol WebSocket server. Auto-detects `netwatch.*` vs Reactotron message format in `handleMessage()`. Single port serves both protocols.
- **`src/store.ts`** — Zustand store. Batched request additions (100ms debounce). Filtered requests derived from full list + filter text + bookmarks filter. Uses stable memoized selectors.
- **`src/components/App.tsx`** — Main layout: header, filter bar, split panes (RequestList + RequestDetail), footer. All keyboard input handled here.
- **`src/components/RequestList.tsx`** — Left pane with follow-cursor scrolling.
- **`src/components/RequestDetail.tsx`** — Right pane with request/response body, JSON syntax highlighting.
- **`src/utils.ts`** — URL pattern matching (substring, glob `*/?`, regex `/pattern/`), fuzzy search via Fuse.js, formatting.
- **`src/hooks/useMouse.ts`** — SGR mouse encoding, click/scroll/hover events.
- **`src/utils/curl.ts`** — cURL command generation.
- **`src/utils/export.ts`** — HAR and JSON export.

### Client flow

`netwatch-client/src/index.ts` → creates `NetwatchSocket` (auto-reconnecting WebSocket, exponential backoff 2s→30s) → patches `globalThis.fetch` → sends `netwatch.hello` on connect → queues up to 50 requests while disconnected → flushes on reconnect.

### Rendering

Flicker-free terminal output uses two techniques: Ink's incremental rendering mode and Synchronized Output (BSU/ESU escape sequences) wrapping `process.stdout.write`.

## Testing

66 tests total (53 server + 13 client). Tests use Vitest. Test files live in `src/__tests__/` and `netwatch-client/src/__tests__/`.
