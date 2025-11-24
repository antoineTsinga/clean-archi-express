import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { projectRouter } from "@/modules/project/infrastructure/http/ProjectRouter.js";
import { ProjectController } from "@/modules/project/infrastructure/http/ProjectController.js";

// Mock the controller methods
vi.mock("@/modules/project/infrastructure/http/ProjectController.js", () => ({
  ProjectController: {
    create: vi.fn((req, res) => res.status(201).send()),
    getProjectsByUserId: vi.fn((req, res) => res.status(200).send()),
  },
}));

describe("ProjectRouter", () => {
  const app = express();
  app.use(express.json());
  app.use("/projects", projectRouter);

  it("should route POST / to ProjectController.create", async () => {
    await request(app).post("/projects").send({ name: "Test", description: "Desc", userId: "u1" });

    expect(ProjectController.create).toHaveBeenCalled();
  });

  it("should route GET /:userId to ProjectController.getProjectsByUserId", async () => {
    await request(app).get("/projects/u1");

    expect(ProjectController.getProjectsByUserId).toHaveBeenCalled();
  });
});
