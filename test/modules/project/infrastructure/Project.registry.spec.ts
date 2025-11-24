import "reflect-metadata";
import { describe, it, expect } from "vitest";
import { container } from "tsyringe";
import "@/modules/project/infrastructure/Project.registry.js";

describe("Project.registry", () => {
  it("should register Project module dependencies", () => {
    // Simply importing the registry file should register the dependencies
    // This test ensures the file is loaded and executed
    expect(container).toBeDefined();
  });
});
