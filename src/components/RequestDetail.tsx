import React from "react";
import { Box, Text, useInput } from "ink";
import chalk from "chalk";
import { useStore } from "../store.js";
import { useShallow } from "zustand/react/shallow";

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

function getStatusColor(status: number): (s: string) => string {
  if (status >= 200 && status < 300) return chalk.green;
  if (status >= 300 && status < 400) return chalk.yellow;
  return chalk.red;
}

// Stable selectors
const selectFilteredRequests = (s: ReturnType<typeof useStore.getState>) => s.filteredRequests;
const selectSelectedIndex = (s: ReturnType<typeof useStore.getState>) => s.selectedIndex;

interface RequestDetailProps {
  visibleLines?: number;
}

export const RequestDetail = React.memo(function RequestDetail({
  visibleLines = 20,
}: RequestDetailProps) {
  const filteredRequests = useStore(useShallow(selectFilteredRequests));
  const selectedIndex = useStore(selectSelectedIndex);
  const [showResponse, setShowResponse] = React.useState(true);
  const [scrollOffset, setScrollOffset] = React.useState(0);

  const request = filteredRequests[selectedIndex];

  // Reset scroll when request or view changes
  React.useEffect(() => {
    setScrollOffset(0);
  }, [selectedIndex, showResponse]);

  useInput((input) => {
    if (input === "r") {
      setShowResponse((s) => !s);
    } else if (input === "d") {
      setScrollOffset((s) => s + 5);
    } else if (input === "u") {
      setScrollOffset((s) => Math.max(0, s - 5));
    }
  });

  if (!request) {
    return (
      <Box paddingX={1}>
        <Text dimColor>Select a request</Text>
      </Box>
    );
  }

  const statusColor = getStatusColor(request.status);
  const data = showResponse ? request.response : request.request;
  const body = formatJson(data.body);
  const lines = body ? body.split("\n") : [];
  const displayLines = lines.slice(scrollOffset, scrollOffset + visibleLines);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>
        <Text bold>{request.method}</Text> {statusColor(String(request.status))} <Text dimColor>{request.duration}ms</Text>
      </Text>
      <Text wrap="truncate" dimColor>{request.url}</Text>
      <Text dimColor>[r] {showResponse ? "res" : "req"}</Text>
      {displayLines.length > 0 && (
        <Text>{displayLines.join("\n")}</Text>
      )}
      {lines.length > visibleLines && (
        <Text dimColor>↕ {scrollOffset + 1}-{Math.min(scrollOffset + visibleLines, lines.length)}/{lines.length}</Text>
      )}
    </Box>
  );
});
