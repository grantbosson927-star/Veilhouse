import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";

function createContext(overrides: Partial<NonNullable<TrpcContext["user"]>> = {}): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "reader-open-id",
      name: "Reader",
      email: "reader@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("curator access", () => {
  it("unlocks the curator desk for the configured curator email on another Manus account", async () => {
    let setCookie = "";
    const context = createContext({ email: "another-manus-account@example.com" });
    context.res = {
      cookie: (_name: string, value: string) => { setCookie = value; },
    } as TrpcContext["res"];
    const caller = appRouter.createCaller(context);

    await expect(caller.curator.unlock({ email: "brilliantelay5@gmail.com" })).resolves.toEqual({ unlocked: true });
    expect(setCookie).toBeTruthy();

    const accessContext = createContext({ email: "another-manus-account@example.com" });
    accessContext.req = { headers: { cookie: `veilhouse-curator-access=${setCookie}` } } as TrpcContext["req"];
    await expect(appRouter.createCaller(accessContext).curator.access()).resolves.toBe(true);
  });

  it("accepts the authenticated project owner's current account email", async () => {
    let setCookie = "";
    const context = createContext({ id: 1, openId: ENV.ownerOpenId, name: ENV.ownerName || "brillantelay5", email: "brillantelay5@gmail.com" });
    context.res = {
      cookie: (_name: string, value: string) => { setCookie = value; },
    } as TrpcContext["res"];
    await expect(appRouter.createCaller(context).curator.unlock({ email: "brillantelay5@gmail.com" })).resolves.toEqual({ unlocked: true });
    expect(setCookie).toBeTruthy();
  });

  it("rejects authenticated non-admin users", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.curator.list()).rejects.toMatchObject<TRPCError>({ code: "FORBIDDEN" });
  });

  it("rejects authenticated admins who are not the project owner", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin", openId: "another-admin-open-id" }));
    await expect(caller.curator.list()).rejects.toMatchObject<TRPCError>({ code: "FORBIDDEN" });
  });

  it("accepts the configured project owner", async () => {
    expect(ENV.ownerOpenId).toBeTruthy();
    const caller = appRouter.createCaller(createContext({ role: "admin", openId: ENV.ownerOpenId }));
    await expect(caller.curator.access()).resolves.toBe(true);
  });
});
