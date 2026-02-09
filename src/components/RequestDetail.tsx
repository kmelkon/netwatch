import React from "react";
import { Box, Text, useInput } from "ink";
import chalk from "chalk";
import { useStore } from "../store.js";
import { useShallow } from "zustand/react/shallow";
import { formatBytes } from "../utils.js";

function formatJson(data: unknown): string {
  if (data === null || data === undefined) return "";
  if (typeof data === "string") {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
}

function highlightJsonLine(line: string): string {
  return line
    // Keys: "key":
    .replace(/"([^"]+)"(?=\s*:)/g, chalk.cyan('"$1"'))
    // String values: : "value"
    .replace(/:\s*"([^"]*)"(,?)$/gm, `: ${chalk.green('"$1"')}$2`)
    // Numbers
    .replace(/:\s*(-?\d+\.?\d*)(,?)$/gm, `: ${chalk.yellow("$1")}$2`)
    // Booleans and null
    .replace(/:\s*(true|false|null)(,?)$/gm, `: ${chalk.magenta("$1")}$2`)
    // Brackets/braces
    .replace(/^(\s*)([\[\]{},])$/gm, `$1${chalk.dim("$2")}`);
}

const STATUS_TEXT: Record<number, string> = {
  200: "OK", 201: "Created", 204: "No Content",
  301: "Moved", 302: "Found", 304: "Not Modified",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
  404: "Not Found", 405: "Method Not Allowed", 409: "Conflict",
  422: "Unprocessable", 429: "Too Many Requests",
  500: "Server Error", 502: "Bad Gateway", 503: "Unavailable", 504: "Timeout",
};

function statusBadge(status: number): string {
  const text = ` ${status} ${STATUS_TEXT[status] || ""} `;
  if (status >= 200 && status < 300) return chalk.bgGreen.white.bold(text);
  if (status >= 300 && status < 400) return chalk.bgYellow.black.bold(text);
  return chalk.bgRed.white.bold(text);
}

function formatHeaders(headers: Record<string, string>): string[] {
  return Object.entries(headers).map(
    ([key, value]) => `${chalk.cyan(key)}: ${value}`
  );
}

// Stable selectors
const selectFilteredRequests = (s: ReturnType<typeof useStore.getState>) => s.filteredRequests;
const selectSelectedIndex = (s: ReturnType<typeof useStore.getState>) => s.selectedIndex;
const selectFilterFocused = (s: ReturnType<typeof useStore.getState>) => s.filterFocused;

export interface DetailScrollHandle {
  scroll(delta: number): void;
}

interface RequestDetailProps {
  visibleLines?: number;
}

export const RequestDetail = React.memo(
  React.forwardRef<DetailScrollHandle, RequestDetailProps>(function RequestDetail(
    { visibleLines = 20 },
    ref
  ) {
    const filteredRequests = useStore(useShallow(selectFilteredRequests));
    const selectedIndex = useStore(selectSelectedIndex);
    const filterFocused = useStore(selectFilterFocused);
    const [showResponse, setShowResponse] = React.useState(true);
    const [showHeaders, setShowHeaders] = React.useState(false);
    const [scrollOffset, setScrollOffset] = React.useState(0);

    const request = filteredRequests[selectedIndex];

    // Build content lines
    const contentLines = React.useMemo(() => {
      if (!request) return [];

      const data = showResponse ? request.response : request.request;
      const result: string[] = [];

      if (showHeaders && data.headers) {
        result.push(chalk.bold.dim("Headers"));
        result.push(...formatHeaders(data.headers));
        result.push(chalk.dim("─".repeat(40)));
      }

      result.push(chalk.bold.dim("Body"));
      const body = formatJson(data.body);
      if (body) {
        result.push(...body.split("\n").map(highlightJsonLine));
      } else {
        result.push(chalk.dim("(empty)"));
      }

      return result;
    }, [request, showResponse, showHeaders]);

    const maxScroll = Math.max(0, contentLines.length - visibleLines);
    const maxScrollRef = React.useRef(maxScroll);
    maxScrollRef.current = maxScroll;

    // Reset scroll when request or view changes
    React.useEffect(() => {
      setScrollOffset(0);
    }, [selectedIndex, showResponse, showHeaders]);

    // Imperative scroll handle for mouse integration
    React.useImperativeHandle(ref, () => ({
      scroll(delta: number) {
        setScrollOffset((s) => Math.max(0, Math.min(maxScrollRef.current, s + delta)));
      },
    }));

    useInput((input) => {
      if (input === "r") {
        setShowResponse((s) => !s);
      } else if (input === "h") {
        setShowHeaders((s) => !s);
      } else if (input === "d") {
        setScrollOffset((s) => Math.min(maxScrollRef.current, s + 3));
      } else if (input === "u") {
        setScrollOffset((s) => Math.max(0, s - 3));
      }
    }, { isActive: !filterFocused });

    if (!request) {
      return (
        <Box paddingX={1}>
          <Text dimColor>Select a request</Text>
        </Box>
      );
    }

    const displayLines = contentLines.slice(scrollOffset, scrollOffset + visibleLines);

    return (
      <Box flexDirection="column" paddingX={1}>
        <Text>
          <Text bold>{request.method}</Text> {statusBadge(request.status)} <Text dimColor>{request.duration}ms {formatBytes(request.requestSize)} → {formatBytes(request.responseSize)}</Text>
        </Text>
        <Text wrap="truncate" dimColor>{request.url}</Text>
        <Text dimColor>
          [r] {showResponse ? "response" : "request"} │ [h] headers {showHeaders ? "on" : "off"}
        </Text>
        <Text dimColor>{"─".repeat(40)}</Text>
        {displayLines.length > 0 && (
          <Text>{displayLines.join("\n")}</Text>
        )}
        {contentLines.length > visibleLines && (
          <Text dimColor>↕ {scrollOffset + 1}-{Math.min(scrollOffset + visibleLines, contentLines.length)}/{contentLines.length}</Text>
        )}
      </Box>
    );
  })
);
