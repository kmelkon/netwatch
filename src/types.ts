export interface ReactotronCommand {
  type: string;
  connectionId: number;
  clientId?: string;
  date: Date;
  deltaTime: number;
  important: boolean;
  messageId: number;
  payload: unknown;
}

export interface ClientIntroPayload {
  name: string;
  reactotronVersion?: string;
  platform?: string;
}

export interface ApiResponsePayload {
  duration: number;
  request: {
    data: unknown;
    headers: Record<string, string>;
    method: string;
    params: unknown;
    url: string;
  };
  response: {
    body: string;
    headers: Record<string, string>;
    status: number;
  };
}

// Netwatch native protocol messages
export interface NetwatchHelloMessage {
  type: "netwatch.hello";
  name: string;
  platform?: string;
}

export interface NetwatchRequestMessage {
  type: "netwatch.request";
  id: number;
  timestamp: string;
  duration: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
    size: number;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: string;
    size: number;
  };
}

export interface StoredRequest {
  id: number;
  timestamp: Date;
  method: string;
  url: string;
  status: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  bookmarked: boolean;
  request: {
    headers: Record<string, string>;
    body: unknown;
  };
  response: {
    headers: Record<string, string>;
    body: string;
  };
}
