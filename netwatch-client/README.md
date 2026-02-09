# netwatch-client

Lightweight network inspector client for React Native. Patches `fetch()` and sends request data to [netwatch](https://github.com/kmelkon/netwatch) over WebSocket.

**Zero dependencies. ~200 LOC.**

## Install

```bash
npm install netwatch-client
```

## Usage

```typescript
// App.tsx or index.js
if (__DEV__) {
  require("netwatch-client").connect({ name: "MyApp" });
}
```

Then run `npx netwatch` in your terminal.

## Options

```typescript
connect({
  host: "localhost",     // server host (default: "localhost")
  port: 9090,            // server port (default: 9090)
  name: "MyApp",         // display name in netwatch (default: "React Native")
  platform: "ios",       // optional platform tag
  ignoredUrls: [         // substring match, skip noisy URLs
    "/symbolicate",
    "/logs",
  ],
});
```

`connect()` returns a `disconnect` function for cleanup:

```typescript
const disconnect = connect({ name: "MyApp" });

// Later
disconnect();
```

## How it works

1. **Patches `globalThis.fetch`** — wraps every `fetch()` call, captures request/response metadata (method, URL, headers, body, status, duration, size), then forwards the original response untouched.

2. **Sends data over WebSocket** — each captured request is sent as a JSON message to the netwatch server.

3. **Auto-reconnects** — exponential backoff (2s initial, 30s max). Start or restart the server anytime without reloading the app.

4. **Queues while disconnected** — buffers up to 50 requests. All queued requests flush on reconnect.

## What gets captured

Only `fetch()` calls are intercepted — not `XMLHttpRequest`. This means your app's HTTP traffic is captured, but background traffic from third-party SDKs (analytics, Optimizely, etc.) using XHR or native HTTP modules won't appear. This keeps the request list focused on your app's code.

## Reactotron comparison

| | netwatch-client | Reactotron networking |
|---|---|---|
| Dependencies | Zero | Reactotron ecosystem |
| Auto-reconnect | Built-in (exponential backoff) | Manual (`onDisconnect` handler) |
| Offline queue | 50 messages | None |
| Patches | `fetch()` only | XHR (noisier) |
| Setup | 2 lines | 5+ lines |

Both protocols work on the same netwatch server simultaneously — migrate incrementally.

## License

MIT
