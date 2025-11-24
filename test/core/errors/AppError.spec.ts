import { AppError } from "@/core/errors/AppError.js";
import { describe, it, expect } from "vitest";

describe("AppError", () => {
  it("should create an error with default values", () => {
    const error = new AppError("Something went wrong");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error).toBeInstanceOf(Error);
  });

  it("should create an error with custom values", () => {
    const error = new AppError("Custom error", 400, "BAD_REQUEST");
    expect(error.message).toBe("Custom error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
  });
});
