# netwatch

Terminal-based network inspector for React Native apps. Captures HTTP requests via Reactotron and displays them in a flicker-free split-pane TUI.

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
- **Config file** — `.netwatchrc` for port, mode, ignored URLs, max requests
- **Performance stats** — real-time statistics with avg, min, max, and P95 response times
- **Request replay** — replay any captured request with a single keystroke
- **Session persistence** — save and load request sessions across app restarts
- **Enhanced error highlighting** — failed requests (4xx/5xx) are visually distinguished
- **Bookmarking** — mark important requests for later review
- **Export functionality** — export requests as HAR or JSON format
- **cURL generation** — copy requests as cURL commands to clipboard

## Quick Start

```bash
# Clone and install
git clone https://github.com/kmelkon/netwatch.git
cd netwatch
npm install --registry https://registry.npmjs.org/

# Run
npm start
```

Then configure your React Native app to connect Reactotron to port 9090.

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
| `x` | Copy request as cURL |
| `R` | Replay selected request |
| `e` | Export requests (HAR/JSON) |
| `s` | Toggle performance stats panel |
| `S` | Save current session |
| `L` | Load saved session |
| `c` | Clear all requests (press twice) |
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
  "mode": "reactotron",
  "ignoredUrls": ["/symbolicate", "/logs"],
  "maxRequests": 500
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `port` | `9090` | WebSocket server port |
| `mode` | `"reactotron"` | Connection mode (`reactotron` or `standalone`) |
| `ignoredUrls` | `[]` | URL patterns to ignore |
| `maxRequests` | `500` | Max stored requests |

The `NETWATCH_PORT` environment variable overrides the config file port.

## Advanced Features

### Performance Statistics

Press `s` to toggle the performance stats panel, which displays:
- **Total requests** and **error count** (4xx/5xx status codes)
- **Average, min, max** response times
- **P95 latency** — 95th percentile response time
- **Total bandwidth** consumed

### Request Replay

Press `R` on any request to replay it immediately. Useful for:
- Testing API endpoints during development
- Reproducing errors or specific scenarios
- Validating API changes

### Session Persistence

- Press `S` to save the current request history to disk
- Press `L` to load a previously saved session
- Sessions are stored in `~/.netwatch/session.json`
- Bookmarked requests are preserved when clearing

### Enhanced Error Highlighting

Failed requests (HTTP 4xx/5xx) are:
- Highlighted with a red background indicator
- Marked with an `!` icon in the request list
- Show error count in the stats panel

### Bookmarking

- Press `b` to bookmark/unbookmark the selected request
- Press `B` to filter and show only bookmarked requests
- Bookmarked requests are marked with a `★` icon
- Bookmarks are preserved when clearing all requests (using the `c` key twice)

### Export & Integration

- Press `e` to export requests in HAR or JSON format
- Press `x` to copy the selected request as a cURL command
- HAR format is compatible with tools like Postman, Insomnia, and HAR viewers
- cURL commands can be used directly in terminal or scripts

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

## Reactotron Setup

In your React Native app:

```typescript
import Reactotron from "reactotron-react-native";

Reactotron.configure({
  host: "localhost",
  port: 9090,
})
  .useReactNative({ networking: true })
  .connect();
```

> **Tip:** Reactotron doesn't auto-reconnect. Add `onDisconnect` to retry:
>
> ```typescript
> Reactotron.configure({
>   host: "localhost",
>   port: 9090,
>   onDisconnect: () => setTimeout(() => Reactotron.connect(), 3000),
> })
> ```
