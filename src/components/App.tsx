import React from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { useStore } from "../store.js";
import { RequestList } from "./RequestList.js";
import { RequestDetail } from "./RequestDetail.js";

// Stable selectors for Header
const selectConnected = (s: ReturnType<typeof useStore.getState>) => s.connected;
const selectClientName = (s: ReturnType<typeof useStore.getState>) => s.clientName;
const selectRequestCount = (s: ReturnType<typeof useStore.getState>) => s.requests.length;
const selectFilteredCount = (s: ReturnType<typeof useStore.getState>) => s.filteredRequests.length;
const selectHasFilter = (s: ReturnType<typeof useStore.getState>) => s.filterText.length > 0;
const selectPaused = (s: ReturnType<typeof useStore.getState>) => s.paused;

// Stable selectors for FilterBar
const selectFilterText = (s: ReturnType<typeof useStore.getState>) => s.filterText;
const selectSetFilterText = (s: ReturnType<typeof useStore.getState>) => s.setFilterText;
const selectFilterFocused = (s: ReturnType<typeof useStore.getState>) => s.filterFocused;

// Stable selectors for App
const selectSetFilterFocused = (s: ReturnType<typeof useStore.getState>) => s.setFilterFocused;
const selectClearRequests = (s: ReturnType<typeof useStore.getState>) => s.clearRequests;
const selectTogglePaused = (s: ReturnType<typeof useStore.getState>) => s.togglePaused;

const Header = React.memo(function Header() {
  const connected = useStore(selectConnected);
  const clientName = useStore(selectClientName);
  const requestCount = useStore(selectRequestCount);
  const filteredCount = useStore(selectFilteredCount);
  const hasFilter = useStore(selectHasFilter);
  const paused = useStore(selectPaused);

  return (
    <Box paddingX={1}>
      <Text bold>netwatch</Text>
      <Text> │ </Text>
      {connected ? (
        <Text color="green">● {clientName || "Connected"}</Text>
      ) : (
        <Text color="yellow">○ Waiting on :9090</Text>
      )}
      <Text> │ </Text>
      <Text dimColor>
        {requestCount} reqs
        {hasFilter && ` (${filteredCount} match)`}
      </Text>
      {paused && (
        <>
          <Text> │ </Text>
          <Text color="red">PAUSED</Text>
        </>
      )}
    </Box>
  );
});

const FilterBar = React.memo(function FilterBar() {
  const filterText = useStore(selectFilterText);
  const setFilterText = useStore(selectSetFilterText);
  const filterFocused = useStore(selectFilterFocused);

  return (
    <Box paddingX={1}>
      <Text dimColor>/</Text>
      <Text> </Text>
      {filterFocused ? (
        <TextInput
          value={filterText}
          onChange={setFilterText}
          placeholder="Filter..."
        />
      ) : (
        <Text dimColor>{filterText || "/ to filter"}</Text>
      )}
    </Box>
  );
});

const Footer = React.memo(function Footer() {
  return (
    <Box paddingX={1}>
      <Text dimColor>↑↓/jk nav │ ud scroll │ r toggle │ c clear │ p pause │ q quit</Text>
    </Box>
  );
});

export function App() {
  const filterFocused = useStore(selectFilterFocused);
  const setFilterFocused = useStore(selectSetFilterFocused);
  const clearRequests = useStore(selectClearRequests);
  const togglePaused = useStore(selectTogglePaused);
  const { exit } = useApp();

  // Calculate heights once on mount
  const [mainHeight] = React.useState(() => {
    const rows = process.stdout.rows ?? 24;
    return Math.max(5, rows - 4);
  });

  useInput((input, key) => {
    if (key.escape && filterFocused) {
      setFilterFocused(false);
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
    <Box flexDirection="column">
      <Header />
      <FilterBar />
      <Box height={mainHeight}>
        <Box width="50%" flexDirection="column">
          <RequestList maxItems={mainHeight} />
        </Box>
        <Box width="50%" flexDirection="column">
          <RequestDetail visibleLines={mainHeight - 5} />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
