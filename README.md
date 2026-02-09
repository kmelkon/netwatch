# netwatch

Terminal-based network inspector for React Native apps. Captures HTTP requests and displays them in a flicker-free split-pane TUI.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Ink](https://img.shields.io/badge/Ink-6.6-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Split-pane TUI** — request list (left) + detail view (right) with borders
- **Flicker-free rendering** — Ink incremental rendering + synchronized output (BSU/ESU)
- **JSON syntax highlighting** — colored keys, strings, numbers, booleans in response bodies
- **Status badges** — background-colored status codes with descriptions (200 OK, 404 Not Found, etc.)
- **Headers toggle** — press `h` to show/hide request/response headers
- **Fuzzy filtering** — press `/` to search by URL, method, or status
- **Mouse support** — click to focus panes, scroll wheel on focused pane, hover highlighting
- **Follow-cursor scrolling** — request list viewport follows selection
- **Request/response toggle** — press `r` to switch between request and response body
- **Pause capture** — press `p` to pause incoming requests
- **Terminal resize** — layout adjusts dynamically on window resize
- **Config file** — `.netwatchrc` for port, ignored URLs, max requests
- **Dual protocol** — supports both `netwatch-client` and Reactotron simultaneously
- **Auto-reconnect** — `netwatch-client` reconnects automatically, start server anytime

## Quick Start

```bash
# Clone and install
git clone https://github.com/kmelkon/netwatch.git
cd netwatch
npm install --registry https://registry.npmjs.org/

# Run
npm start
```

## Client Setup (Recommended)

Install `netwatch-client` in your React Native app — zero dependencies, patches `fetch` directly:

```bash
npm install netwatch-client
```

```typescript
// App.tsx or index.js
if (__DEV__) {
  require("netwatch-client").connect({ name: "MyApp" });
}
```

That's it. The client auto-connects to netwatch on `localhost:9090` with exponential backoff — start the server anytime, no app restart needed.

### Client Options

```typescript
connect({
  host: "localhost",     // server host
  port: 9090,            // server port
  name: "MyApp",         // display name in netwatch
  platform: "ios",       // optional platform tag
  ignoredUrls: [         // substring match, skip noisy URLs
    "/symbolicate",
    "/logs",
  ],
});
```

## Reactotron Setup (Legacy)

Reactotron is still supported — both protocols work on the same port simultaneously.

```typescript
import Reactotron from "reactotron-react-native";

Reactotron.configure({
  host: "localhost",
  port: 9090,
})
  .useReactNative({ networking: true })
  .connect();
```

> **Note:** Reactotron doesn't auto-reconnect. `netwatch-client` is recommended instead.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑↓` / `j/k` | Navigate request list |
| `u` / `d` | Scroll detail pane |
| `r` | Toggle request/response body |
| `h` | Toggle headers display |
| `/` | Focus filter input |
| `Esc` | Exit filter |
| `b` | Bookmark selected request |
| `B` | Toggle bookmarks-only filter |
| `x` | Copy as cURL |
| `e` | Export (HAR/JSON) |
| `c` | Clear all requests (double-tap) |
| `p` | Pause/resume capture |
| `q` | Quit |

## Mouse Support

- **Click** a pane to focus it (cyan border)
- **Scroll wheel** on the focused pane to scroll content
- **Hover** highlights pane border (yellow)

Requires a terminal with mouse support (iTerm2, kitty, WezTerm, Windows Terminal).

## Configuration

Create a `.netwatchrc` file in your project root or `~/.netwatchrc`:

```json
{
  "port": 9090,
  "ignoredUrls": ["/symbolicate", "/logs"],
  "maxRequests": 500
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `port` | `9090` | WebSocket server port |
| `ignoredUrls` | `[]` | URL patterns to ignore (substring, glob, or regex) |
| `maxRequests` | `500` | Max stored requests |

The `NETWATCH_PORT` environment variable overrides the config file port.

## Tech Stack

- [Ink](https://github.com/vadimdemedes/ink) — React for terminal UIs
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [Fuse.js](https://fusejs.io/) — fuzzy search
- [ws](https://github.com/websockets/ws) — WebSocket server
- [chalk](https://github.com/chalk/chalk) — terminal styling

## Development

```bash
npm run dev        # Watch mode
npm test           # Run tests
npm run test:watch # Watch tests
```
