import "reflect-metadata";
import { describe, it, expect, beforeEach } from "vitest";
import { autoRegister } from "@/infrastructure/di/autoRegister.js";
import { container } from "tsyringe";
import path from "path";

describe("autoRegister", () => {
  beforeEach(() => {
    // Reset container to see new registrations being detected
    container.clearInstances();
    container.reset();
  });

  it("should register services from fixtures", async () => {
    const fixturePath = path.resolve(__dirname, "../../fixtures/di").replace(/\\/g, "/");

    const result = await autoRegister({
      roots: [fixturePath],
      patterns: ["**/*.service.ts"],
      container: container,
    });

    // Verify that files were found and imported
    expect(result.files.length).toBe(1);
    expect(result.files.some((f) => f.includes("test.service.ts"))).toBe(true);

    // Verify that registrations were detected
    expect(result.added.length).toBeGreaterThan(0);

    // Import types dynamically to get the tokens and classes
    const { TEST_TOKENS, TestService, TestService2 } = await import(
      "@test/fixtures/di/test.service.js"
    );

    // Verify that services can be resolved
    expect(container.resolve(TestService)).toBeInstanceOf(TestService);
    expect(container.resolve(TEST_TOKENS.ITestService2)).toBeInstanceOf(TestService2);
  });

  it("should throw error in strict mode if no files found", async () => {
    await expect(
      autoRegister({
        roots: ["/non/existent/path"],
        strict: true,
      })
    ).rejects.toThrow();
  });
});
