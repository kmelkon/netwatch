import React from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { useStore } from "../store.js";
import { RequestList } from "./RequestList.js";
import { RequestDetail } from "./RequestDetail.js";

export function App() {
  const connected = useStore((s) => s.connected);
  const clientName = useStore((s) => s.clientName);
  const requestCount = useStore((s) => s.requests.length);
  const filteredCount = useStore((s) => s.filteredRequests.length);
  const filterText = useStore((s) => s.filterText);
  const setFilterText = useStore((s) => s.setFilterText);
  const filterFocused = useStore((s) => s.filterFocused);
  const setFilterFocused = useStore((s) => s.setFilterFocused);
  const clearRequests = useStore((s) => s.clearRequests);
  const paused = useStore((s) => s.paused);
  const togglePaused = useStore((s) => s.togglePaused);
  const { exit } = useApp();
  // Read terminal height once on mount to avoid re-renders
  const [terminalHeight] = React.useState(() => process.stdout.rows ?? 24);

  useInput((input, key) => {
    if (key.escape) {
      if (filterFocused) {
        setFilterFocused(false);
      }
    } else if (input === "/" && !filterFocused) {
      setFilterFocused(true);
    } else if (input === "c" && !filterFocused) {
      clearRequests();
    } else if (input === "p" && !filterFocused) {
      togglePaused();
    } else if (input === "q" && !filterFocused) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Header */}
      <Box borderStyle="single" borderBottom borderTop={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text bold>netwatch</Text>
        <Text> │ </Text>
        {connected ? (
          <Text color="green">● {clientName || "Connected"}</Text>
        ) : (
          <Text color="yellow">○ Waiting for connection on :9090</Text>
        )}
        <Text> │ </Text>
        <Text dimColor>
          {requestCount} requests
          {filterText && ` (${filteredCount} filtered)`}
        </Text>
        {paused && (
          <>
            <Text> │ </Text>
            <Text color="red">⏸ PAUSED</Text>
          </>
        )}
      </Box>

      {/* Filter */}
      <Box paddingX={1} paddingY={0}>
        <Text dimColor>/</Text>
        <Text> </Text>
        {filterFocused ? (
          <TextInput
            value={filterText}
            onChange={setFilterText}
            placeholder="Filter by URL, method, status..."
          />
        ) : (
          <Text dimColor>
            {filterText || "Press / to filter"}
          </Text>
        )}
      </Box>

      {/* Main content */}
      <Box flexGrow={1}>
        {/* Request list - left side */}
        <Box width="50%" flexDirection="column" borderStyle="single" borderRight borderTop={false} borderBottom={false} borderLeft={false}>
          <RequestList />
        </Box>

        {/* Request detail - right side */}
        <Box width="50%" flexDirection="column">
          <RequestDetail />
        </Box>
      </Box>

      {/* Footer */}
      <Box paddingX={1} borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false}>
        <Text dimColor>
          ↑/↓ navigate │ r toggle req/res │ c clear │ p pause │ / filter │ q quit
        </Text>
      </Box>
    </Box>
  );
}
