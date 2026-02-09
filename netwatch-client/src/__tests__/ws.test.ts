import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NetwatchSocket } from "../ws.js";

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
}

describe("NetwatchSocket", () => {
  let originalWebSocket: typeof globalThis.WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    originalWebSocket = globalThis.WebSocket;
    // @ts-expect-error mock
    globalThis.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
  });

  it("sends hello message on connect", async () => {
    const socket = new NetwatchSocket("localhost", 9090, "TestApp", "ios");

    await vi.advanceTimersByTimeAsync(10);

    // Get the underlying mock WS
    // @ts-expect-error private access for testing
    const ws = socket.ws as MockWebSocket;
    expect(ws.sent).toHaveLength(1);

    const hello = JSON.parse(ws.sent[0]);
    expect(hello.type).toBe("netwatch.hello");
    expect(hello.name).toBe("TestApp");
    expect(hello.platform).toBe("ios");

    socket.disconnect();
  });

  it("queues messages when not connected", () => {
    // Make WebSocket fail to connect
    // @ts-expect-error mock
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        this.readyState = MockWebSocket.CLOSED;
        // Don't fire onopen
        this.onopen = null;
      }
    };

    const socket = new NetwatchSocket("localhost", 9090, "TestApp");

    socket.send({ type: "netwatch.request", id: 1, timestamp: "", duration: 0, request: { method: "GET", url: "/test", headers: {}, body: null, size: 0 }, response: { status: 200, headers: {}, body: "", size: 0 } });
    socket.send({ type: "netwatch.request", id: 2, timestamp: "", duration: 0, request: { method: "GET", url: "/test2", headers: {}, body: null, size: 0 }, response: { status: 200, headers: {}, body: "", size: 0 } });

    // @ts-expect-error private access for testing
    expect(socket.queue).toHaveLength(2);

    socket.disconnect();
  });

  it("respects max queue size of 50", () => {
    // @ts-expect-error mock
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        this.readyState = MockWebSocket.CLOSED;
        this.onopen = null;
      }
    };

    const socket = new NetwatchSocket("localhost", 9090, "TestApp");

    for (let i = 0; i < 60; i++) {
      socket.send({ type: "netwatch.request", id: i, timestamp: "", duration: 0, request: { method: "GET", url: `/test${i}`, headers: {}, body: null, size: 0 }, response: { status: 200, headers: {}, body: "", size: 0 } });
    }

    // @ts-expect-error private access for testing
    expect(socket.queue).toHaveLength(50);

    socket.disconnect();
  });

  it("flushes queue on reconnect", async () => {
    let wsInstance: MockWebSocket | null = null;
    // @ts-expect-error mock
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        this.readyState = MockWebSocket.CLOSED;
        this.onopen = null;
        wsInstance = this;
      }
    };

    const socket = new NetwatchSocket("localhost", 9090, "TestApp");

    socket.send({ type: "netwatch.request", id: 1, timestamp: "", duration: 0, request: { method: "GET", url: "/queued", headers: {}, body: null, size: 0 }, response: { status: 200, headers: {}, body: "", size: 0 } });

    // @ts-expect-error private access for testing
    expect(socket.queue).toHaveLength(1);

    // Simulate successful reconnect
    wsInstance!.readyState = MockWebSocket.OPEN;
    wsInstance!.onopen?.();

    // Queue should be flushed: hello + 1 queued message
    expect(wsInstance!.sent).toHaveLength(2);
    // @ts-expect-error private access for testing
    expect(socket.queue).toHaveLength(0);

    socket.disconnect();
  });

  it("schedules reconnect with 2s initial backoff", async () => {
    let connectCount = 0;
    // @ts-expect-error mock
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        connectCount++;
        // Simulate connection failure
        this.readyState = MockWebSocket.CLOSED;
        setTimeout(() => this.onclose?.(), 0);
      }
    };

    const socket = new NetwatchSocket("localhost", 9090, "TestApp");
    await vi.advanceTimersByTimeAsync(10); // First connect + close

    expect(connectCount).toBe(1);

    // After 2s, should reconnect
    await vi.advanceTimersByTimeAsync(2000);
    expect(connectCount).toBe(2);

    socket.disconnect();
  });

  it("cleans up on disconnect", () => {
    const socket = new NetwatchSocket("localhost", 9090, "TestApp");

    socket.disconnect();

    // @ts-expect-error private access for testing
    expect(socket.ws).toBeNull();
    // @ts-expect-error private access for testing
    expect(socket.queue).toHaveLength(0);
    // @ts-expect-error private access for testing
    expect(socket.closed).toBe(true);
  });
});
