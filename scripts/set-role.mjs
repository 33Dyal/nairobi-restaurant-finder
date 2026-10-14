// Dev helper: set a user's role and, optionally, mark their email as verified.
// Run from the project root, after the account has been registered:
//
//   node scripts\set-role.mjs admin.test@example.com ADMIN --verify
//   node scripts\set-role.mjs owner.a@example.com CUSTOMER --verify
//
// Roles: CUSTOMER, OWNER, ADMIN. Meant for your local test database.
import "dotenv/config";
import pg from "pg";

const ROLES = ["CUSTOMER", "OWNER", "ADMIN"];
const [email, role, ...flags] = process.argv.slice(2);
const verify = flags.includes("--verify");

if (!email || !ROLES.includes(role)) {
  console.error(`Usage: node scripts\\set-role.mjs <email> <${ROLES.join("|")}> [--verify]`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check your .env file and run this from the project root.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  const found = await client.query(
    `SELECT id, email, role, "emailVerifiedAt" FROM "User" WHERE lower(email) = lower($1) AND "deletedAt" IS NULL`,
    [email],
  );

  if (found.rowCount === 0) {
    console.error(`No user found with the email ${email}. Register that account in the app first.`);
    process.exitCode = 1;
  } else {
    const before = found.rows[0];
    const updated = await client.query(
      `UPDATE "User"
         SET role = $1::"Role",
             "emailVerifiedAt" = CASE WHEN $2::boolean THEN COALESCE("emailVerifiedAt", now()) ELSE "emailVerifiedAt" END,
             "updatedAt" = now()
       WHERE id = $3
       RETURNING email, role, "emailVerifiedAt"`,
      [role, verify, before.id],
    );
    const after = updated.rows[0];
    const label = (u) => `${u.role} (${u.emailVerifiedAt ? "email verified" : "email NOT verified"})`;
    console.log(`User:   ${after.email}`);
    console.log(`Before: ${label(before)}`);
    console.log(`After:  ${label(after)}`);
    console.log("Sign out and back in for the new role to take effect.");
  }
} catch (error) {
  console.error("Could not update the user:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}