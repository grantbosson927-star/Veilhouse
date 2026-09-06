import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("accepts the original password and rejects a wrong one", async () => {
    const stored = await hashPassword("correct horse");
    await expect(verifyPassword("correct horse", stored)).resolves.toBe(true);
    await expect(verifyPassword("wrong battery", stored)).resolves.toBe(false);
    await expect(verifyPassword("correct horse", null)).resolves.toBe(false);
  });
});
