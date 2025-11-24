import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { PinoHttpRequestLogger } from "@/infrastructure/logging/PinoHttpRequestLogger.registry.js";
import { pinoHttp } from "pino-http";

// Mock pinoConfig to avoid transport issues
vi.mock("@/infrastructure/logging/pinoConfig.js", () => ({
  createBasePinoLogger: () => ({
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }),
  }),
}));

// Mock pino-http
vi.mock("pino-http", () => ({
  pinoHttp: vi.fn().mockReturnValue((req: any, res: any, next: any) => next()),
}));

describe("PinoHttpRequestLogger", () => {
  it("should create an instance", () => {
    const logger = new PinoHttpRequestLogger();
    expect(logger).toBeInstanceOf(PinoHttpRequestLogger);
  });

  it("should configure pinoHttp with correct options", () => {
    // Capture the options passed to pinoHttp
    let capturedOptions: any;
    vi.mocked(pinoHttp).mockImplementation((opts: any) => {
      capturedOptions = opts;
      return ((req: any, res: any, next: any) => next()) as any;
    });

    new PinoHttpRequestLogger();

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.genReqId).toBeDefined();
    expect(capturedOptions.customReceivedMessage).toBeDefined();
    expect(capturedOptions.customSuccessMessage).toBeDefined();
    expect(capturedOptions.customErrorMessage).toBeDefined();
    expect(capturedOptions.customLogLevel).toBeDefined();

    // Test genReqId
    const mockReq: any = { headers: {} };
    const mockRes: any = { setHeader: vi.fn() };

    // Case 1: Existing ID in request
    mockReq.id = "existing-id";
    expect(capturedOptions.genReqId(mockReq, mockRes)).toBe("existing-id");

    // Case 2: Existing ID in headers
    delete mockReq.id;
    mockReq.headers["x-request-id"] = "header-id";
    expect(capturedOptions.genReqId(mockReq, mockRes)).toBe("header-id");

    // Case 3: New ID generation
    delete mockReq.headers["x-request-id"];
    const newId = capturedOptions.genReqId(mockReq, mockRes);
    expect(newId).toBeDefined();
    expect(mockRes.setHeader).toHaveBeenCalledWith("X-Request-Id", newId);

    // Test customReceivedMessage
    mockReq.method = "GET";
    mockReq.originalUrl = "/test";
    mockReq.ip = "127.0.0.1";
    mockReq.id = "test-id";
    const msg = capturedOptions.customReceivedMessage(mockReq, mockRes);
    expect(msg).toContain("Started GET /test for 127.0.0.1");
    expect(mockReq._startAt).toBeDefined();

    // Test customSuccessMessage
    mockRes.statusCode = 200;
    mockRes.getHeader = vi.fn().mockReturnValue(100);
    const successMsg = capturedOptions.customSuccessMessage(mockReq, mockRes);
    expect(successMsg).toContain("Completed 200 100 in");

    // Test customErrorMessage
    const error = new Error("Test error");
    const errorMsg = capturedOptions.customErrorMessage(mockReq, mockRes, error);
    expect(errorMsg).toContain("Error 200 100 in");
    expect(errorMsg).toContain("Test error");

    // Test customLogLevel
    expect(capturedOptions.customLogLevel(mockReq, { statusCode: 200 }, null)).toBe("info");
    expect(capturedOptions.customLogLevel(mockReq, { statusCode: 400 }, null)).toBe("warn");
    expect(capturedOptions.customLogLevel(mockReq, { statusCode: 500 }, null)).toBe("error");
    expect(capturedOptions.customLogLevel(mockReq, { statusCode: 200 }, new Error())).toBe("error");
    expect(capturedOptions.customLogLevel(mockReq, { statusCode: 200 }, new Error())).toBe("error");

    // Test serializers
    expect(capturedOptions.serializers.req()).toBeUndefined();
    expect(capturedOptions.serializers.res()).toBeUndefined();
    expect(capturedOptions.serializers.responseTime()).toBeUndefined();
  });

  it("should return middleware", () => {
    const logger = new PinoHttpRequestLogger();
    const middleware = logger.getMiddleware();
    expect(middleware).toBeTypeOf("function");
  });
});
