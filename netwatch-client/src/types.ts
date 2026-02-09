export interface HelloMessage {
  type: "netwatch.hello";
  name: string;
  platform?: string;
}

export interface RequestMessage {
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

export interface ConnectOptions {
  host?: string;
  port?: number;
  name?: string;
  ignoredUrls?: string[];
  platform?: string;
}
