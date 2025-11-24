import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PinoAppLogger } from "@/infrastructure/logging/PinoAppLogger.registry.js";

// Mock pinoConfig to avoid transport issues
vi.mock("@/infrastructure/logging/pinoConfig.js", () => ({
  createBasePinoLogger: () => ({
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("PinoAppLogger", () => {
  let logger: PinoAppLogger;

  beforeEach(() => {
    logger = PinoAppLogger.createRoot();
  });

  it("should create a root logger", () => {
    expect(logger).toBeInstanceOf(PinoAppLogger);
  });

  it("should create a child logger with bindings", () => {
    const childLogger = logger.child({ context: "TestContext", userId: "123" });
    expect(childLogger).toBeInstanceOf(PinoAppLogger);
  });

  it("should log debug messages", () => {
    expect(() => logger.debug("Debug message")).not.toThrow();
    expect(() => logger.debug("Debug with meta", { userId: "123" })).not.toThrow();
  });

  it("should log info messages", () => {
    expect(() => logger.info("Info message")).not.toThrow();
    expect(() => logger.info("Info with meta", { context: "Test" })).not.toThrow();
  });

  it("should log warn messages", () => {
    expect(() => logger.warn("Warning message")).not.toThrow();
    expect(() => logger.warn("Warning with meta", { code: "WARN_001" })).not.toThrow();
  });

  it("should log error messages", () => {
    expect(() => logger.error("Error message")).not.toThrow();
    expect(() => logger.error("Error with meta", { error: "Something went wrong" })).not.toThrow();
  });
});
