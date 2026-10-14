import { describe, it, expect } from "vitest";
import { clientEnv } from "@/lib/env";

describe("clientEnv", () => {
  it("falls back to a default app URL", () => {
    expect(clientEnv.NEXT_PUBLIC_APP_URL).toMatch(/^https?:\/\//);
  });
});
