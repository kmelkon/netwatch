import React from "react";
import { execSync } from "node:child_process";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { useStore } from "../store.js";
import { RequestList } from "./RequestList.js";
import { RequestDetail, type DetailScrollHandle } from "./RequestDetail.js";
import { useMouse } from "../hooks/useMouse.js";
import { formatBytes } from "../utils.js";
import { toCurl } from "../utils/curl.js";
import { exportToFile } from "../utils/export.js";

// Stable selectors for Header
const selectConnected = (s: ReturnType<typeof useStore.getState>) => s.connected;
const selectClientName = (s: ReturnType<typeof useStore.getState>) => s.clientName;
const selectRequestCount = (s: ReturnType<typeof useStore.getState>) => s.requests.length;
const selectTotalBandwidth = (s: ReturnType<typeof useStore.getState>) =>
  s.requests.reduce((sum, r) => sum + r.responseSize, 0);
const selectFilteredCount = (s: ReturnType<typeof useStore.getState>) => s.filteredRequests.length;
const selectHasFilter = (s: ReturnType<typeof useStore.getState>) => s.filterText.length > 0;
const selectPaused = (s: ReturnType<typeof useStore.getState>) => s.paused;
const selectShowBookmarksOnly = (s: ReturnType<typeof useStore.getState>) => s.showBookmarksOnly;

// Stable selectors for FilterBar
const selectFilterText = (s: ReturnType<typeof useStore.getState>) => s.filterText;
const selectSetFilterText = (s: ReturnType<typeof useStore.getState>) => s.setFilterText;
const selectFilterFocused = (s: ReturnType<typeof useStore.getState>) => s.filterFocused;

// Stable selectors for App
const selectSetFilterFocused = (s: ReturnType<typeof useStore.getState>) => s.setFilterFocused;
const selectClearRequests = (s: ReturnType<typeof useStore.getState>) => s.clearRequests;
const selectTogglePaused = (s: ReturnType<typeof useStore.getState>) => s.togglePaused;
const selectToggleBookmark = (s: ReturnType<typeof useStore.getState>) => s.toggleBookmark;
const selectToggleBookmarksFilter = (s: ReturnType<typeof useStore.getState>) => s.toggleBookmarksFilter;

const Header = React.memo(function Header() {
  const connected = useStore(selectConnected);
  const clientName = useStore(selectClientName);
  const requestCount = useStore(selectRequestCount);
  const totalBandwidth = useStore(selectTotalBandwidth);
  const filteredCount = useStore(selectFilteredCount);
  const hasFilter = useStore(selectHasFilter);
  const paused = useStore(selectPaused);
  const showBookmarksOnly = useStore(selectShowBookmarksOnly);

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
        {requestCount} reqs │ {formatBytes(totalBandwidth)}
        {hasFilter && ` (${filteredCount} match)`}
      </Text>
      {showBookmarksOnly && (
        <>
          <Text> │ </Text>
          <Text color="yellow">★ BOOKMARKS</Text>
        </>
      )}
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
      <KeyBadge keys="b" label="bookmark" />
      <KeyBadge keys="x" label="curl" />
      <KeyBadge keys="e" label="export" />
      <KeyBadge keys="c" label="clear" />
      <KeyBadge keys="p" label="pause" />
      <KeyBadge keys="q" label="quit" />
    </Box>
  );
});

function copyToClipboard(text: string): boolean {
  const escaped = text.replace(/'/g, "'\\''");
  try {
    if (process.platform === "darwin") {
      execSync(`printf '%s' '${escaped}' | pbcopy`);
    } else {
      execSync(`printf '%s' '${escaped}' | xclip -sel clip`);
    }
    return true;
  } catch {
    return false;
  }
}

export function App() {
  const filterFocused = useStore(selectFilterFocused);
  const setFilterFocused = useStore(selectSetFilterFocused);
  const clearRequests = useStore(selectClearRequests);
  const togglePaused = useStore(selectTogglePaused);
  const toggleBookmark = useStore(selectToggleBookmark);
  const toggleBookmarksFilter = useStore(selectToggleBookmarksFilter);
  const { exit } = useApp();
  const detailRef = React.useRef<DetailScrollHandle>(null);
  const [focusedPane, setFocusedPane] = React.useState<"list" | "detail">("list");
  const [hoveredPane, setHoveredPane] = React.useState<"list" | "detail" | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [exportPrompt, setExportPrompt] = React.useState(false);
  const clearPendingRef = React.useRef(false);
  const clearTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Status flash — auto-clears after 2s
  const showStatus = React.useCallback((msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2000);
  }, []);

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
    // Export format prompt takes priority
    if (exportPrompt) {
      if (input === "1" || input === "2") {
        const format = input === "1" ? "har" : "json";
        const { requests } = useStore.getState();
        if (requests.length === 0) {
          showStatus("No requests to export");
        } else {
          try {
            const path = exportToFile(requests, format);
            showStatus(`Exported to ${path}`);
          } catch {
            showStatus("Export failed");
          }
        }
        setExportPrompt(false);
      } else if (key.escape) {
        setExportPrompt(false);
      }
      return;
    }

    if (key.escape && filterFocused) {
      setFilterFocused(false);
    } else if (input === "/" && !filterFocused) {
      setFilterFocused(true);
    } else if (input === "c" && !filterFocused) {
      if (clearPendingRef.current) {
        clearPendingRef.current = false;
        if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
        clearRequests();
      } else {
        clearPendingRef.current = true;
        showStatus("Press c again to clear");
        clearTimeoutRef.current = setTimeout(() => {
          clearPendingRef.current = false;
        }, 2000);
      }
    } else if (input === "p" && !filterFocused) {
      togglePaused();
    } else if (input === "q" && !filterFocused) {
      exit();
    } else if (input === "b" && !filterFocused) {
      const { filteredRequests, selectedIndex } = useStore.getState();
      const selected = filteredRequests[selectedIndex];
      if (selected) toggleBookmark(selected.id);
    } else if (input === "B" && !filterFocused) {
      toggleBookmarksFilter();
    } else if (input === "x" && !filterFocused) {
      const { filteredRequests, selectedIndex } = useStore.getState();
      const selected = filteredRequests[selectedIndex];
      if (selected) {
        const curl = toCurl(selected);
        const ok = copyToClipboard(curl);
        showStatus(ok ? "Copied!" : "Copy failed");
      }
    } else if (input === "e" && !filterFocused) {
      setExportPrompt(true);
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
      {exportPrompt && (
        <Box paddingX={1}>
          <Text color="yellow">Export: </Text>
          <Text><Text bold color="cyan">1</Text><Text dimColor> HAR  </Text></Text>
          <Text><Text bold color="cyan">2</Text><Text dimColor> JSON  </Text></Text>
          <Text dimColor>esc cancel</Text>
        </Box>
      )}
      {statusMessage && (
        <Box paddingX={1}>
          <Text color="green">{statusMessage}</Text>
        </Box>
      )}
      <Footer />
    </Box>
  );
}
