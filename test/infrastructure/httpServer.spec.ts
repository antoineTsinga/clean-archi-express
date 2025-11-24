import "reflect-metadata";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "@/infrastructure/httpServer.js";
import { container } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";

// Mock DB
vi.mock("@/infrastructure/db/db.js", () => ({
  AppDataSource: {
    isInitialized: false,
    initialize: vi.fn().mockResolvedValue(true),
    destroy: vi.fn().mockResolvedValue(true),
    options: {
      type: "sqlite",
      database: "test.sqlite",
    },
  },
}));

// Mock Routers
vi.mock("@/modules/user/infrastructure/http/UserRouter.js", () => ({
  userRouter: (req: any, res: any, next: any) => next(),
}));
vi.mock("@/modules/project/infrastructure/http/ProjectRouter.js", () => ({
  projectRouter: (req: any, res: any, next: any) => next(),
}));

// Mock http server
vi.mock("http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("http")>();
  return {
    ...actual,
    createServer: vi.fn().mockReturnValue({
      listen: vi.fn((port, cb) => {
        if (cb) cb();
        return { close: vi.fn((cb) => cb && cb()) };
      }),
      address: vi.fn(),
      on: vi.fn(),
    }),
  };
});

// Mock portUtils
vi.mock("@/infrastructure/utils/portUtils.js", () => ({
  isPortAvailable: vi.fn().mockResolvedValue(true),
}));

describe("httpServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock logger
    const mockLogger: any = {
      info: vi.fn(),
      error: vi.fn(),
      getMiddleware: vi.fn().mockReturnValue((req: any, res: any, next: any) => {
        req.logger = mockLogger;
        next();
      }),
      child: vi.fn(),
    };
    mockLogger.child.mockReturnValue(mockLogger);
    container.register(TOKENS.HttpRequestLogger, { useValue: mockLogger });
    container.register(TOKENS.Logger, { useValue: mockLogger });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.clearInstances();
  });

  describe("createApp", () => {
    it("should create an express app with middleware and routes", async () => {
      const app = await createApp();

      expect(app).toBeDefined();

      // Verify health check
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("UP");
    });

    it("should handle root route", async () => {
      const app = await createApp();
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.text).toBe("OK");
    });

    it("should handle 404", async () => {
      const app = await createApp();
      const res = await request(app).get("/unknown-route");
      expect(res.status).toBe(404);
    });
    it("should handle error route", async () => {
      const app = await createApp();
      const res = await request(app).get("/error");
      expect(res.status).toBe(500);
      expect(res.body.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("startHttp", () => {
    it("should start the server when port is available", async () => {
      const { startHttp } = await import("@/infrastructure/httpServer.js");

      // Spy on process.exit to prevent actual exit if something goes wrong
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

      await startHttp(3000);

      expect(exitSpy).not.toHaveBeenCalled();
    });

    it("should exit if port is not available", async () => {
      const { startHttp } = await import("@/infrastructure/httpServer.js");
      const { isPortAvailable } = await import("@/infrastructure/utils/portUtils.js");

      // Mock port not available
      vi.mocked(isPortAvailable).mockResolvedValueOnce(false);

      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

      await startHttp(3000);

      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
