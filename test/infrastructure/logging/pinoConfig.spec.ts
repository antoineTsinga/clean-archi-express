import { describe, it, expect, vi } from "vitest";
import { createBasePinoLogger } from "@/infrastructure/logging/pinoConfig.js";
import pino from "pino";

vi.mock("pino", () => ({
  default: vi.fn(() => ({ info: vi.fn() })),
}));

describe("pinoConfig", () => {
  it("should return pino logger", () => {
    createBasePinoLogger();
    expect(pino).toHaveBeenCalled();
  });
});
