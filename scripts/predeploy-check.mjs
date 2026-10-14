import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { spawnSync } from "node:child_process";

const results = [];
const pass = (name, note = "") => results.push({ s: "PASS", name, note });
const warn = (name, note = "") => results.push({ s: "WARN", name, note });
const fail = (name, note = "") => results.push({ s: "FAIL", name, note });

// Load .env (Node 20.12+)
try { process.loadEnvFile(".env"); } catch { fail(".env file", "missing or unreadable"); }

// 1. Node version
const major = Number(process.versions.node.split(".")[0]);
major >= 20 ? pass("Node version", process.version) : fail("Node version", `${process.version} (need 20+)`);

// 2. Environment variables (edit this list to match your app)
const required = ["NEXT_PUBLIC_APP_URL", "RESEND_API_KEY", "RESEND_FROM_EMAIL"];
for (const key of required) {
  process.env[key] ? pass(`env ${key}`) : fail(`env ${key}`, "not set");
}
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
if (appUrl) {
  if (/localhost|127\.0\.0\.1|192\.168\./.test(appUrl)) warn("NEXT_PUBLIC_APP_URL", `points to a local address: ${appUrl}`);
  else if (!appUrl.startsWith("https://")) warn("NEXT_PUBLIC_APP_URL", "not https");
  else pass("NEXT_PUBLIC_APP_URL", appUrl);
}
const from = process.env.RESEND_FROM_EMAIL || "";
if (from && !/@[\w.-]+\.\w+/.test(from)) fail("RESEND_FROM_EMAIL", "doesn't contain a valid email address");

// 3. Hero image is a real JPEG, not a renamed file
const hero = "public/images/hero.jpg";
if (!existsSync(hero)) fail("Hero image", `${hero} not found`);
else {
  const buf = readFileSync(hero);
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const mb = (buf.length / 1024 / 1024).toFixed(2);
  if (!isJpeg) fail("Hero image", "file exists but is not a valid JPEG");
  else if (buf.length > 1024 * 1024) warn("Hero image", `valid JPEG but ${mb} MB (consider compressing)`);
  else pass("Hero image", `${mb} MB`);
}

// 4. Source scan
const bad = [];
const todo = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".next", ".git"].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if ([".js", ".jsx", ".mjs", ".ts", ".tsx"].includes(extname(p))) {
      const src = readFileSync(p, "utf8");
      if (src.includes("next/font/google")) bad.push(p);
      if (/\b(TODO|FIXME)\b/.test(src)) todo.push(p);
    }
  }
}
for (const d of ["app", "components", "lib", "config"]) if (existsSync(d)) walk(d);
bad.length ? fail("next/font/google leftovers", bad.join(", ")) : pass("No next/font/google imports");
todo.length ? warn("TODO/FIXME comments", `${todo.length} file(s)`) : pass("No TODO/FIXME comments");

// 5. Fonts installed
for (const pkg of ["@fontsource-variable/bricolage-grotesque", "@fontsource-variable/instrument-sans"]) {
  existsSync(join("node_modules", pkg)) ? pass(`package ${pkg}`) : fail(`package ${pkg}`, "not installed");
}

// 6. Commands
function run(label, cmd, { warnOnly = false } = {}) {
  console.log(`\n> ${cmd}`);
  const r = spawnSync(cmd, { shell: true, stdio: "inherit" });
  if (r.status === 0) pass(label);
  else (warnOnly ? warn : fail)(label, `exit code ${r.status}`);
}
const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts || {};
if (scripts.lint) run("Lint", "npm run lint");
else warn("Lint", "no lint script in package.json");
run("Production build", "npm run build");
run("Dependency audit (production, high+)", "npm audit --omit=dev --audit-level=high", { warnOnly: true });

// Summary
console.log("\n========== PRE-DEPLOY SUMMARY ==========");
for (const r of results) console.log(`${r.s.padEnd(5)} ${r.name}${r.note ? " - " + r.note : ""}`);
const failed = results.filter((r) => r.s === "FAIL").length;
const warned = results.filter((r) => r.s === "WARN").length;
console.log(`\n${failed} failed, ${warned} warnings`);
console.log(failed ? "NOT ready to deploy." : "Ready to deploy.");
process.exit(failed ? 1 : 0);