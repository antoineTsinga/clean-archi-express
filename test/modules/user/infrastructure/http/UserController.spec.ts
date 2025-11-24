import "reflect-metadata";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UserController } from "@/modules/user/infrastructure/http/UserController.js";
import { container } from "tsyringe";
import { Request, Response } from "express";
import { TOKENS } from "@/core/di/tokens.js";

describe("UserController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("should create user and return 201", async () => {
      const userData = { name: "John", email: "john@example.com" };
      mockRequest.body = userData;
      const createdUser = { id: "u1", ...userData };

      const mockCreateUser = {
        execute: vi.fn().mockResolvedValue(createdUser),
      };

      vi.spyOn(container, "resolve").mockReturnValue(mockCreateUser as any);

      await UserController.create(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(container.resolve).toHaveBeenCalledWith(TOKENS.CreateUser);
      expect(mockCreateUser.execute).toHaveBeenCalledWith(userData.name, userData.email);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdUser);
    });

    it("should call next with error if creation fails", async () => {
      mockRequest.body = { name: "John", email: "john@example.com" };
      const error = new Error("Creation failed");

      const mockCreateUser = {
        execute: vi.fn().mockRejectedValue(error),
      };

      vi.spyOn(container, "resolve").mockReturnValue(mockCreateUser as any);

      await UserController.create(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });
});
