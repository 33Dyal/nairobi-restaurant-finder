import bcrypt from "bcryptjs";

// bcrypt only uses the first 72 bytes, so the validation layer caps passwords at 72.
const COST = process.env.NODE_ENV === "test" ? 4 : 12;

export function hashPassword(password) {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Compared against when no user exists, so response time doesn't reveal valid emails.
let dummyHash;
export async function verifyAgainstDummy(password) {
  dummyHash ??= await bcrypt.hash("not-a-real-password", COST);
  await bcrypt.compare(password, dummyHash);
  return false;
}
