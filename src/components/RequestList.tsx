import React from "react";
import { Box, Text, useInput } from "ink";
import chalk from "chalk";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store.js";
import type { StoredRequest } from "../types.js";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour12: false });
}

function getStatusColor(status: number): (s: string) => string {
  if (status >= 200 && status < 300) return chalk.green;
  if (status >= 300 && status < 400) return chalk.yellow;
  return chalk.red;
}

function truncateUrl(url: string, maxLen = 50): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    return path.length > maxLen ? path.slice(0, maxLen - 1) + "…" : path;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen - 1) + "…" : url;
  }
}

export const RequestList = React.memo(function RequestList() {
  const requestCount = useStore((s) => s.requests.length);
  const filteredRequests = useStore(useShallow((s) => s.filteredRequests));
  const selectedIndex = useStore((s) => s.selectedIndex);
  const setSelectedIndex = useStore((s) => s.setSelectedIndex);
  const filterFocused = useStore((s) => s.filterFocused);

  useInput(
    (input, key) => {
      if (filterFocused) return;

      const maxIndex = filteredRequests.length - 1;
      if (maxIndex < 0) return;

      if (key.upArrow || input === "k") {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      } else if (key.downArrow || input === "j") {
        setSelectedIndex(Math.min(maxIndex, selectedIndex + 1));
      }
    },
    { isActive: !filterFocused }
  );

  if (filteredRequests.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>
          {requestCount === 0
            ? "No requests yet..."
            : "No requests match filter"}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {filteredRequests.slice(0, 20).map((req, idx) => (
        <RequestRow
          key={req.id}
          request={req}
          selected={idx === selectedIndex}
        />
      ))}
    </Box>
  );
});

const RequestRow = React.memo(function RequestRow({
  request,
  selected,
}: {
  request: StoredRequest;
  selected: boolean;
}) {
  const statusColor = getStatusColor(request.status);
  const methodPad = request.method.padEnd(6);

  return (
    <Box>
      <Text inverse={selected}>
        {selected ? "▶" : " "} {formatTime(request.timestamp)}{" "}
        <Text bold>{methodPad}</Text>{" "}
        {statusColor(String(request.status))}{" "}
        {truncateUrl(request.url)}{" "}
        <Text dimColor>{request.duration}ms</Text>
      </Text>
    </Box>
  );
});
