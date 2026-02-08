import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../store.js";
import { formatBytes } from "../utils.js";

interface Stats {
  totalRequests: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  totalBandwidth: number;
}

function calculateStats(requests: typeof useStore extends (...args: any) => infer R ? R extends { requests: infer T } ? T : never : never): Stats {
  if (requests.length === 0) {
    return {
      totalRequests: 0,
      errorCount: 0,
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      totalBandwidth: 0,
    };
  }

  const durations = requests.map((r) => r.duration).sort((a, b) => a - b);
  const errorCount = requests.filter((r) => r.status >= 400).length;
  const totalBandwidth = requests.reduce((sum, r) => sum + r.responseSize, 0);

  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const min = durations[0];
  const max = durations[durations.length - 1];
  const p95Index = Math.floor(durations.length * 0.95);
  const p95 = durations[p95Index] || max;

  return {
    totalRequests: requests.length,
    errorCount,
    avgResponseTime: Math.round(avg),
    minResponseTime: min,
    maxResponseTime: max,
    p95ResponseTime: p95,
    totalBandwidth,
  };
}

const selectRequests = (s: ReturnType<typeof useStore.getState>) => s.requests;

export const StatsPanel = React.memo(function StatsPanel() {
  const requests = useStore(selectRequests);
  const stats = React.useMemo(() => calculateStats(requests), [requests]);

  return (
    <Box flexDirection="column" paddingX={1} borderStyle="single" borderColor="gray">
      <Text bold dimColor>Performance Stats</Text>
      <Box>
        <Text dimColor>Total: </Text>
        <Text>{stats.totalRequests}</Text>
        <Text> │ </Text>
        <Text dimColor>Errors: </Text>
        <Text color={stats.errorCount > 0 ? "red" : "green"}>{stats.errorCount}</Text>
        <Text> │ </Text>
        <Text dimColor>Bandwidth: </Text>
        <Text>{formatBytes(stats.totalBandwidth)}</Text>
      </Box>
      <Box>
        <Text dimColor>Avg: </Text>
        <Text>{stats.avgResponseTime}ms</Text>
        <Text> │ </Text>
        <Text dimColor>Min: </Text>
        <Text>{stats.minResponseTime}ms</Text>
        <Text> │ </Text>
        <Text dimColor>Max: </Text>
        <Text>{stats.maxResponseTime}ms</Text>
        <Text> │ </Text>
        <Text dimColor>P95: </Text>
        <Text>{stats.p95ResponseTime}ms</Text>
      </Box>
    </Box>
  );
});
