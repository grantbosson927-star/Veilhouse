import { describe, expect, it } from "vitest";
import { publishCuratorPostHandler } from "./scheduled";

describe("scheduled curator publishing", () => {
  it("rejects requests without a cron session", async () => {
    let statusCode = 200;
    let body: unknown;
    const response = {
      status(code: number) { statusCode = code; return response; },
      json(value: unknown) { body = value; return response; },
    } as any;

    await publishCuratorPostHandler({ headers: {}, originalUrl: "/api/scheduled/publishCuratorPost" } as any, response);

    expect(statusCode).toBe(403);
    expect(body).toEqual({ error: "cron-only" });
  });
});
