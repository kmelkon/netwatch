import { useEffect, useRef } from "react";
import { useStdin } from "ink";

type ScrollDirection = "up" | "down";

const SGR_MOUSE_RE = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g;

/**
 * Listens for SGR mouse scroll events via Ink's internal event emitter.
 * Only fires for scroll events on the right half of the terminal (detail pane).
 * Requires SGR mouse mode to be enabled via `\x1b[?1006h` on stdout.
 */
export function useMouseScroll(callback: (direction: ScrollDirection) => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Access Ink's internal event emitter — Ink consumes all stdin via
  // `readable` events and re-emits data on this emitter.
  // Listening on process.stdin directly doesn't work because Ink's
  // `stdin.read()` drains the buffer first.
  const { internal_eventEmitter } = useStdin();

  useEffect(() => {
    if (!internal_eventEmitter) return;

    const handler = (data: string) => {
      const midpoint = Math.floor((process.stdout.columns ?? 80) / 2);

      for (const match of data.matchAll(SGR_MOUSE_RE)) {
        const button = parseInt(match[1]!, 10);
        const x = parseInt(match[2]!, 10);

        // Only handle scroll events when cursor is on the right pane
        // SGR button codes: 64 = scroll up, 65 = scroll down
        if (x > midpoint) {
          if (button === 64) {
            callbackRef.current("up");
          } else if (button === 65) {
            callbackRef.current("down");
          }
        }
      }
    };

    internal_eventEmitter.on("input", handler);
    return () => {
      internal_eventEmitter.off("input", handler);
    };
  }, [internal_eventEmitter]);
}
