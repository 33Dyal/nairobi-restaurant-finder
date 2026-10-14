import { describe, it, expect, beforeEach, vi } from "vitest";
import fake from "../helpers/fake-prisma";

vi.mock("@/lib/db/prisma", () => ({ prisma: fake }));

const { issueSession, rotateRefreshToken, revokeByToken, revokeAllForUser } = await import("@/lib/auth/refresh-tokens");
const { createEmailToken, consumeEmailToken } = await import("@/lib/auth/email-tokens");
const { hashToken } = await import("@/lib/auth/crypto");

let user;
beforeEach(async () => {
  fake.reset();
  user = await fake.user.create({ data: { email: "a@example.com", name: "A", passwordHash: "x" } });
});

describe("refresh token rotation", () => {
  it("stores only a hash of the refresh token", async () => {
    const { refreshToken } = await issueSession(user);
    const row = fake.refreshToken.rows[0];
    expect(row.tokenHash).toBe(hashToken(refreshToken));
    expect(JSON.stringify(row)).not.toContain(refreshToken);
  });

  it("rotates: new token works, old one is revoked and linked", async () => {
    const first = await issueSession(user);
    const second = await rotateRefreshToken(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    const [oldRow, newRow] = fake.refreshToken.rows;
    expect(oldRow.revokedAt).toBeTruthy();
    expect(oldRow.replacedById).toBe(newRow.id);
    expect(newRow.familyId).toBe(oldRow.familyId);
    await expect(rotateRefreshToken(second.refreshToken)).resolves.toBeTruthy();
  });

  it("detects reuse of an old token and revokes the whole family", async () => {
    const first = await issueSession(user);
    const second = await rotateRefreshToken(first.refreshToken);
    // Pretend the rotation happened a while ago, outside the grace window.
    fake.refreshToken.rows[0].revokedAt = new Date(Date.now() - 60_000);
    await expect(rotateRefreshToken(first.refreshToken)).rejects.toMatchObject({ status: 401 });
    expect(fake.refreshToken.rows.every((r) => r.revokedAt)).toBe(true);
    await expect(rotateRefreshToken(second.refreshToken)).rejects.toMatchObject({ status: 401 });
  });

  it("tolerates a near-simultaneous second refresh without killing the session", async () => {
    const first = await issueSession(user);
    const second = await rotateRefreshToken(first.refreshToken);
    await expect(rotateRefreshToken(first.refreshToken)).rejects.toMatchObject({ status: 401 });
    await expect(rotateRefreshToken(second.refreshToken)).resolves.toBeTruthy();
  });

  it("rejects suspended or deleted users and revokes their session", async () => {
    const { refreshToken } = await issueSession(user);
    fake.user.rows[0].status = "SUSPENDED";
    await expect(rotateRefreshToken(refreshToken)).rejects.toMatchObject({ status: 401 });
    expect(fake.refreshToken.rows[0].revokedAt).toBeTruthy();
  });

  it("rejects garbage and unknown tokens", async () => {
    await expect(rotateRefreshToken("not-a-jwt")).rejects.toMatchObject({ status: 401 });
  });

  it("logout revokes the family; reset revokes everything for the user", async () => {
    const a = await issueSession(user);
    await issueSession(user);
    await revokeByToken(a.refreshToken);
    expect(fake.refreshToken.rows.filter((r) => !r.revokedAt)).toHaveLength(1);
    await revokeAllForUser(user.id);
    expect(fake.refreshToken.rows.every((r) => r.revokedAt)).toBe(true);
  });
});

describe("email tokens", () => {
  it("are single use and typed", async () => {
    const token = await createEmailToken(user.id, "VERIFY_EMAIL");
    expect(await consumeEmailToken(token, "RESET_PASSWORD")).toBeNull();
    expect(await consumeEmailToken(token, "VERIFY_EMAIL")).toBe(user.id);
    expect(await consumeEmailToken(token, "VERIFY_EMAIL")).toBeNull();
  });
  it("expire", async () => {
    const token = await createEmailToken(user.id, "RESET_PASSWORD");
    fake.emailToken.rows[0].expiresAt = new Date(Date.now() - 1000);
    expect(await consumeEmailToken(token, "RESET_PASSWORD")).toBeNull();
  });
  it("replace earlier unused tokens of the same type", async () => {
    const first = await createEmailToken(user.id, "RESET_PASSWORD");
    const second = await createEmailToken(user.id, "RESET_PASSWORD");
    expect(await consumeEmailToken(first, "RESET_PASSWORD")).toBeNull();
    expect(await consumeEmailToken(second, "RESET_PASSWORD")).toBe(user.id);
  });
  it("store only hashes", async () => {
    const token = await createEmailToken(user.id, "VERIFY_EMAIL");
    expect(JSON.stringify(fake.emailToken.rows)).not.toContain(token);
  });
});
