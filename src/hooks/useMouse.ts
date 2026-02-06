import { useEffect, useRef } from "react";
import { useStdin } from "ink";

export interface PaneMouseEvent {
  type: "click" | "scroll" | "hover";
  pane: "list" | "detail";
  direction?: "up" | "down";
}

const SGR_MOUSE_RE = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g;

/**
 * Listens for SGR mouse events (clicks + scroll) via Ink's internal event emitter.
 * Determines target pane based on x coordinate (left/right of terminal midpoint).
 * Requires mouse tracking (`\x1b[?1000h`) and SGR mode (`\x1b[?1006h`) enabled.
 */
export function useMouse(callback: (event: PaneMouseEvent) => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { internal_eventEmitter } = useStdin();

  useEffect(() => {
    if (!internal_eventEmitter) return;

    const handler = (data: string) => {
      const midpoint = Math.floor((process.stdout.columns ?? 80) / 2);

      for (const match of data.matchAll(SGR_MOUSE_RE)) {
        const button = parseInt(match[1]!, 10);
        const x = parseInt(match[2]!, 10);
        const suffix = match[4]; // M = press, m = release

        const pane: "list" | "detail" = x <= midpoint ? "list" : "detail";

        // Left click press (button 0, M = press)
        if (button === 0 && suffix === "M") {
          callbackRef.current({ type: "click", pane });
        }
        // Mouse motion / hover (button 35 = no button pressed, moving)
        else if (button === 35) {
          callbackRef.current({ type: "hover", pane });
        }
        // Scroll up (button 64)
        else if (button === 64) {
          callbackRef.current({ type: "scroll", pane, direction: "up" });
        }
        // Scroll down (button 65)
        else if (button === 65) {
          callbackRef.current({ type: "scroll", pane, direction: "down" });
        }
      }
    };

    internal_eventEmitter.on("input", handler);
    return () => {
      internal_eventEmitter.off("input", handler);
    };
  }, [internal_eventEmitter]);
}
