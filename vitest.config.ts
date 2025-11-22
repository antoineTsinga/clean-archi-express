import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@modules": path.resolve(__dirname, "./src/modules"),
    },
    include: ["src/**/*.spec.ts"],
    exclude: ["node_modules", "dist"],
  },
});
