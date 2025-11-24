import "reflect-metadata";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProjectController } from "@/modules/project/infrastructure/http/ProjectController.js";
import { container } from "tsyringe";
import { Request, Response } from "express";
import { TOKENS } from "@/core/di/tokens.js";

describe("ProjectController", () => {
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
    it("should create project and return 201", async () => {
      const projectData = { name: "Test", description: "Desc", userId: "user1" };
      mockRequest.body = projectData;
      const createdProject = { id: "p1", ...projectData };

      const mockCreateProject = {
        execute: vi.fn().mockResolvedValue(createdProject),
      };

      vi.spyOn(container, "resolve").mockReturnValue(mockCreateProject as any);

      await ProjectController.create(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(container.resolve).toHaveBeenCalledWith(TOKENS.CreateProject);
      expect(mockCreateProject.execute).toHaveBeenCalledWith(
        projectData.name,
        projectData.description,
        projectData.userId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdProject);
    });

    it("should call next with error if creation fails", async () => {
      mockRequest.body = { name: "Test", description: "Desc", userId: "user1" };
      const error = new Error("Creation failed");

      const mockCreateProject = {
        execute: vi.fn().mockRejectedValue(error),
      };

      vi.spyOn(container, "resolve").mockReturnValue(mockCreateProject as any);

      await ProjectController.create(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe("getProjectsByUserId", () => {
    it("should return projects and return 200", async () => {
      const userId = "user1";
      mockRequest.params = { userId };
      const projects = [{ id: "p1", name: "Test", description: "Desc", userId }];

      const mockGetUserProjects = {
        execute: vi.fn().mockResolvedValue(projects),
      };

      vi.spyOn(container, "resolve").mockReturnValue(mockGetUserProjects as any);

      await ProjectController.getProjectsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(container.resolve).toHaveBeenCalledWith(TOKENS.GetUserProjects);
      expect(mockGetUserProjects.execute).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(projects);
    });

    it("should call next with error if retrieval fails", async () => {
      mockRequest.params = { userId: "user1" };
      const error = new Error("Retrieval failed");

      const mockGetUserProjects = {
        execute: vi.fn().mockRejectedValue(error),
      };

      vi.spyOn(container, "resolve").mockReturnValue(mockGetUserProjects as any);

      await ProjectController.getProjectsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });
});
