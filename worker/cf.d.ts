interface R2HTTPMetadata {
  contentType?: string;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: R2HTTPMetadata;
  httpEtag: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface R2Bucket {
  put(key: string, value: unknown, options?: { httpMetadata?: R2HTTPMetadata }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}

interface D1Database {
  prepare(query: string): unknown;
  dump(): Promise<ArrayBuffer>;
  batch(statements: unknown[]): Promise<unknown>;
  exec(query: string): Promise<unknown>;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
