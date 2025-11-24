import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { errorMiddleware } from "@/infrastructure/http/middleware/error.middleware.js";
import { AppError } from "@/core/errors/AppError.js";

describe("errorMiddleware", () => {
  const mockLogger = {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  };

  const mockReq = {
    logger: mockLogger,
    method: "GET",
    originalUrl: "/test",
  } as unknown as Request;

  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const mockNext = vi.fn() as NextFunction;

  it("should handle AppError and return appropriate status code", () => {
    const appError = new AppError("Test error", 400, "TEST_ERROR");

    errorMiddleware(appError, mockReq, mockRes, mockNext);

    expect(mockLogger.warn).toHaveBeenCalledWith("Business error", {
      context: "BusinessError",
      code: "TEST_ERROR",
      message: "Test error",
    });
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      code: "TEST_ERROR",
      message: "Test error",
    });
  });

  it("should handle Error instance and return 500", () => {
    const error = new Error("Test error");

    errorMiddleware(error, mockReq, mockRes, mockNext);

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Unhandled application error",
      expect.objectContaining({
        context: "ExpressError",
        method: "GET",
        path: "/test",
        error: "Test error",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  });

  it("should handle string error and return 500", () => {
    const error = "String error";

    errorMiddleware(error, mockReq, mockRes, mockNext);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it("should handle unknown error type and return 500", () => {
    const error = { unknown: "error" };

    errorMiddleware(error, mockReq, mockRes, mockNext);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  });
});
