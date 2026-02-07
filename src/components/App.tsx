import React from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { useStore } from "../store.js";
import { RequestList } from "./RequestList.js";
import { RequestDetail, type DetailScrollHandle } from "./RequestDetail.js";
import { useMouse } from "../hooks/useMouse.js";

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

function KeyBadge({ keys, label }: { keys: string; label: string }) {
  return (
    <Text>
      <Text bold color="cyan">{keys}</Text>
      <Text dimColor> {label}  </Text>
    </Text>
  );
}

const Footer = React.memo(function Footer() {
  return (
    <Box paddingX={1} gap={0}>
      <KeyBadge keys="↑↓" label="nav" />
      <KeyBadge keys="u/d" label="scroll" />
      <KeyBadge keys="r" label="req/res" />
      <KeyBadge keys="h" label="headers" />
      <KeyBadge keys="/" label="filter" />
      <KeyBadge keys="c" label="clear" />
      <KeyBadge keys="p" label="pause" />
      <KeyBadge keys="q" label="quit" />
    </Box>
  );
});

export function App() {
  const filterFocused = useStore(selectFilterFocused);
  const setFilterFocused = useStore(selectSetFilterFocused);
  const clearRequests = useStore(selectClearRequests);
  const togglePaused = useStore(selectTogglePaused);
  const { exit } = useApp();
  const detailRef = React.useRef<DetailScrollHandle>(null);
  const [focusedPane, setFocusedPane] = React.useState<"list" | "detail">("list");
  const [hoveredPane, setHoveredPane] = React.useState<"list" | "detail" | null>(null);

  // Dynamic height: Header(1) + Filter(1) + Footer(1) + borders(2 top/bottom per pane) = 5 overhead
  const computeHeight = () => Math.max(5, (process.stdout.rows ?? 24) - 5);
  const [mainHeight, setMainHeight] = React.useState(computeHeight);

  React.useEffect(() => {
    const onResize = () => setMainHeight(computeHeight());
    process.stdout.on("resize", onResize);
    return () => { process.stdout.off("resize", onResize); };
  }, []);

  // Inner height accounts for border (2 lines: top + bottom)
  const innerHeight = mainHeight - 2;

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

  useMouse((event) => {
    if (event.type === "click") {
      setFocusedPane(event.pane);
    } else if (event.type === "hover") {
      setHoveredPane(event.pane);
    } else if (event.type === "scroll" && event.pane === focusedPane) {
      const delta = event.direction === "down" ? 3 : -3;
      if (focusedPane === "detail") {
        detailRef.current?.scroll(delta);
      } else {
        const { selectedIndex, setSelectedIndex, filteredRequests } = useStore.getState();
        const next = Math.max(0, Math.min(filteredRequests.length - 1, selectedIndex + delta));
        setSelectedIndex(next);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Header />
      <FilterBar />
      <Box height={mainHeight}>
        <Box
          width="50%"
          flexDirection="column"
          borderStyle="single"
          borderColor={focusedPane === "list" ? "cyan" : hoveredPane === "list" ? "yellow" : "gray"}
        >
          <RequestList maxItems={innerHeight} />
        </Box>
        <Box
          width="50%"
          flexDirection="column"
          borderStyle="single"
          borderColor={focusedPane === "detail" ? "cyan" : hoveredPane === "detail" ? "yellow" : "gray"}
        >
          <RequestDetail ref={detailRef} visibleLines={innerHeight - 4} />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
