import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@test": path.resolve(__dirname, "./test"),
    },
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      // all: true,
      include: ["src/**/*.{ts,js}"],
      exclude: ["src/**/*.{spec.ts,spec.js}"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
