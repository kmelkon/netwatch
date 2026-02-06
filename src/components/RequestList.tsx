import React from "react";
import { Box, Text, useInput } from "ink";
import chalk from "chalk";
import { useStore } from "../store.js";
import { useShallow } from "zustand/react/shallow";
import type { StoredRequest } from "../types.js";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour12: false });
}

function getStatusColor(status: number): (s: string) => string {
  if (status >= 200 && status < 300) return chalk.green;
  if (status >= 300 && status < 400) return chalk.yellow;
  return chalk.red;
}

function truncateUrl(url: string, maxLen = 40): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    return path.length > maxLen ? path.slice(0, maxLen - 1) + "…" : path;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen - 1) + "…" : url;
  }
}

// Stable selectors - defined outside component
const selectRequestCount = (s: ReturnType<typeof useStore.getState>) => s.requests.length;
const selectFilteredRequests = (s: ReturnType<typeof useStore.getState>) => s.filteredRequests;
const selectSelectedIndex = (s: ReturnType<typeof useStore.getState>) => s.selectedIndex;
const selectSetSelectedIndex = (s: ReturnType<typeof useStore.getState>) => s.setSelectedIndex;
const selectFilterFocused = (s: ReturnType<typeof useStore.getState>) => s.filterFocused;

interface RequestListProps {
  maxItems?: number;
}

export const RequestList = React.memo(function RequestList({ maxItems = 20 }: RequestListProps) {
  const requestCount = useStore(selectRequestCount);
  const filteredRequests = useStore(useShallow(selectFilteredRequests));
  const selectedIndex = useStore(selectSelectedIndex);
  const setSelectedIndex = useStore(selectSetSelectedIndex);
  const filterFocused = useStore(selectFilterFocused);

  // Follow-cursor scrolling: scrollTop tracks first visible item
  const scrollTopRef = React.useRef(0);
  const prevFilteredRef = React.useRef(filteredRequests);

  // Reset scrollTop when filtered results change (filter text, clear)
  if (filteredRequests !== prevFilteredRef.current) {
    scrollTopRef.current = 0;
    prevFilteredRef.current = filteredRequests;
  }

  // Adjust viewport to follow selection
  if (selectedIndex < scrollTopRef.current) {
    scrollTopRef.current = selectedIndex;
  } else if (selectedIndex >= scrollTopRef.current + maxItems) {
    scrollTopRef.current = selectedIndex - maxItems + 1;
  }
  const scrollTop = scrollTopRef.current;

  const visibleRequests = React.useMemo(
    () => filteredRequests.slice(scrollTop, scrollTop + maxItems),
    [filteredRequests, scrollTop, maxItems]
  );

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
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor>
          {requestCount === 0 ? "No requests yet..." : "No matches"}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {visibleRequests.map((req, idx) => (
        <RequestRow
          key={req.id}
          request={req}
          selected={scrollTop + idx === selectedIndex}
        />
      ))}
      {filteredRequests.length > maxItems && (
        <Text dimColor>
          {" "}↕ {scrollTop + 1}-{Math.min(scrollTop + maxItems, filteredRequests.length)}/{filteredRequests.length}
        </Text>
      )}
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
  const method = request.method.slice(0, 3);

  return (
    <Box>
      <Text inverse={selected}>
        {selected ? ">" : " "}{formatTime(request.timestamp)} {method} {statusColor(String(request.status))} {truncateUrl(request.url)}
      </Text>
    </Box>
  );
});
