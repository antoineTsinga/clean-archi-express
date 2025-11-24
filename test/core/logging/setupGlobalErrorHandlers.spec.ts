import "reflect-metadata";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupGlobalErrorHandlers } from "@/core/logging/setupGlobalErrorHandlers.js";
import { container } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";

describe("setupGlobalErrorHandlers", () => {
  let mockLogger: any;
  let processOnSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    };
    container.register(TOKENS.Logger, { useValue: mockLogger });

    processOnSpy = vi.spyOn(process, "on").mockImplementation(() => process);
    processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.clearInstances();
  });

  it("should register error handlers", () => {
    setupGlobalErrorHandlers();

    expect(processOnSpy).toHaveBeenCalledWith("uncaughtException", expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith("warning", expect.any(Function));
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Global error handlers installed",
      expect.any(Object)
    );
  });

  it("should handle uncaughtException", () => {
    setupGlobalErrorHandlers();

    // Get the handler
    const calls = processOnSpy.mock.calls;
    const handler = calls.find((call: any[]) => call[0] === "uncaughtException")?.[1];
    expect(handler).toBeDefined();

    const error = new Error("Uncaught error");
    handler(error);

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Uncaught exception",
      expect.objectContaining({
        error: "Uncaught error",
      })
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should handle unhandledRejection with Error", () => {
    setupGlobalErrorHandlers();

    const calls = processOnSpy.mock.calls;
    const handler = calls.find((call: any[]) => call[0] === "unhandledRejection")?.[1];
    expect(handler).toBeDefined();

    const error = new Error("Unhandled rejection");
    handler(error);

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled promise rejection",
      expect.objectContaining({
        error: "Unhandled rejection",
      })
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should handle unhandledRejection with non-Error", () => {
    setupGlobalErrorHandlers();

    const calls = processOnSpy.mock.calls;
    const handler = calls.find((call: any[]) => call[0] === "unhandledRejection")?.[1];

    handler("Reason string");

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled promise rejection",
      expect.objectContaining({
        error: "Reason string",
      })
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should handle warning", () => {
    setupGlobalErrorHandlers();

    const calls = processOnSpy.mock.calls;
    const handler = calls.find((call: any[]) => call[0] === "warning")?.[1];
    expect(handler).toBeDefined();

    const warning = new Error("Node warning");
    handler(warning);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Node warning",
      expect.objectContaining({
        error: "Node warning",
      })
    );
  });
});
