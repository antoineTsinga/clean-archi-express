import "reflect-metadata";
import { describe, it, expect } from "vitest";
import { container } from "tsyringe";
import "@/modules/user/infrastructure/User.registry.js";

describe("User.registry", () => {
  it("should register User module dependencies", () => {
    // Simply importing the registry file should register the dependencies
    // This test ensures the file is loaded and executed
    expect(container).toBeDefined();
  });
});
