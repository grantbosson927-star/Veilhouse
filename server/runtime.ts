import { AsyncLocalStorage } from "node:async_hooks";

export type AppRuntime = {
  d1?: D1Database;
  media?: R2Bucket;
};

const storage = new AsyncLocalStorage<AppRuntime>();

export function runWithRuntime<T>(runtime: AppRuntime, fn: () => T): T {
  return storage.run(runtime, fn);
}

export function getRuntime(): AppRuntime | undefined {
  return storage.getStore();
}
