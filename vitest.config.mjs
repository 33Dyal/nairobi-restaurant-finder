import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react({ include: /\.(js|jsx)$/ })],
  // Next.js allows JSX inside .js files, so the test runner must too.
  esbuild: { loader: "jsx", include: /\.(js|jsx)$/, exclude: /node_modules/ },
  oxc: { lang: "jsx", include: /\.(js|jsx)$/, exclude: /node_modules/ },
  test: {
    // Server code (jose, bcrypt, crypto) needs the node environment.
    // Component tests can opt in with: // @vitest-environment jsdom
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    globals: true,
    include: ["tests/**/*.test.{js,jsx}"],
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
});
