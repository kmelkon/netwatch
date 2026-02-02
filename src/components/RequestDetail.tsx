import React from "react";
import { Box, Text, useInput } from "ink";
import chalk from "chalk";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store.js";

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

function HeadersSection({
  title,
  headers,
}: {
  title: string;
  headers: Record<string, string>;
}) {
  const entries = Object.entries(headers);
  if (entries.length === 0) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold dimColor>
        {title}
      </Text>
      {entries.slice(0, 10).map(([key, value]) => (
        <Text key={key} dimColor>
          {key}: {value}
        </Text>
      ))}
      {entries.length > 10 && (
        <Text dimColor>... +{entries.length - 10} more</Text>
      )}
    </Box>
  );
}

function BodySection({ title, body }: { title: string; body: unknown }) {
  const formatted = formatJson(body);
  if (!formatted) return null;

  const lines = formatted.split("\n");
  const truncated = lines.length > 30;
  const displayLines = truncated ? lines.slice(0, 30) : lines;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold dimColor>
        {title}
      </Text>
      <Text>{displayLines.join("\n")}</Text>
      {truncated && <Text dimColor>... +{lines.length - 30} more lines</Text>}
    </Box>
  );
}

export const RequestDetail = React.memo(function RequestDetail() {
  const filteredRequests = useStore(useShallow((s) => s.filteredRequests));
  const selectedIndex = useStore((s) => s.selectedIndex);
  const [showResponse, setShowResponse] = React.useState(true);

  const request = filteredRequests[selectedIndex];

  useInput((input) => {
    if (input === "r") {
      setShowResponse((s) => !s);
    }
  });

  if (!request) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>Select a request to view details</Text>
      </Box>
    );
  }

  const statusColor = getStatusColor(request.status);

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Box marginBottom={1}>
        <Text bold>
          {request.method}{" "}
          {statusColor(String(request.status))}{" "}
          <Text dimColor>{request.duration}ms</Text>
        </Text>
      </Box>
      <Text wrap="truncate">{request.url}</Text>

      <Box marginTop={1}>
        <Text dimColor>
          [r] toggle view • showing: {showResponse ? "response" : "request"}
        </Text>
      </Box>

      {showResponse ? (
        <>
          <HeadersSection
            title="Response Headers"
            headers={request.response.headers}
          />
          <BodySection title="Response Body" body={request.response.body} />
        </>
      ) : (
        <>
          <HeadersSection
            title="Request Headers"
            headers={request.request.headers}
          />
          <BodySection title="Request Body" body={request.request.body} />
        </>
      )}
    </Box>
  );
});
