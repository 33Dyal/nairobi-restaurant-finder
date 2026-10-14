import { randomUUID } from "node:crypto";

// Minimal in-memory stand-in for the Prisma calls the auth code uses.
const match = (row, where = {}) => Object.entries(where).every(([k, v]) => row[k] === v);

function table(name, defaults = () => ({})) {
  const rows = [];
  return {
    rows,
    async create({ data }) {
      if (name === "user" && rows.some((r) => r.email === data.email)) throw new Error("Unique constraint failed on email");
      const row = { id: randomUUID(), createdAt: new Date(), ...defaults(), ...data };
      rows.push(row);
      return { ...row };
    },
    async findUnique({ where, include }) {
      const row = rows.find((r) => match(r, where));
      return row ? { ...row, ...(include?.user ? { user: { ...fake.user.rows.find((u) => u.id === row.userId) } } : {}) } : null;
    },
    async findFirst({ where }) {
      const row = rows.find((r) => match(r, where));
      return row ? { ...row } : null;
    },
    async update({ where, data }) {
      const row = rows.find((r) => match(r, where));
      if (!row) throw new Error("Record not found");
      Object.assign(row, data);
      return { ...row };
    },
    async updateMany({ where, data }) {
      const hit = rows.filter((r) => match(r, where));
      hit.forEach((r) => Object.assign(r, data));
      return { count: hit.length };
    },
    async deleteMany({ where }) {
      const keep = rows.filter((r) => !match(r, where));
      const count = rows.length - keep.length;
      rows.length = 0;
      rows.push(...keep);
      return { count };
    },
  };
}

const fake = {
  user: table("user", () => ({ role: "CUSTOMER", status: "ACTIVE", emailVerifiedAt: null, deletedAt: null, phone: null, avatarUrl: null })),
  refreshToken: table("refreshToken", () => ({ revokedAt: null, replacedById: null })),
  emailToken: table("emailToken", () => ({ usedAt: null })),
  auditLog: table("auditLog"),
  async $transaction(arg) {
    return typeof arg === "function" ? arg(fake) : Promise.all(arg);
  },
  reset() {
    for (const k of ["user", "refreshToken", "emailToken", "auditLog"]) fake[k].rows.length = 0;
  },
};

export default fake;
