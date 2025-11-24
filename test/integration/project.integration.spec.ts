import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "@/infrastructure/httpServer.js";
import { setupIntegrationTest, teardownIntegrationTest } from "./setup.js";
import type { Express } from "express";

describe("Project API Integration Tests", () => {
  let app: Express;
  let userId: string;

  beforeEach(async () => {
    await setupIntegrationTest();
    app = await createApp();

    // Create a user for project tests with unique email
    const userResponse = await request(app)
      .post("/users")
      .send({
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
      });
    userId = userResponse.body.id;
  });

  afterEach(async () => {
    await teardownIntegrationTest();
  });

  describe("POST /projects", () => {
    it("should create a new project", async () => {
      const response = await request(app).post("/projects").send({
        name: "My Project",
        description: "A test project",
        userId: userId,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("My Project");
      expect(response.body.description).toBe("A test project");
      expect(response.body.userId).toBe(userId);
    });

    it("should return 400 for invalid data", async () => {
      const response = await request(app).post("/projects").send({
        name: "My Project",
        // missing description and userId
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /projects/:userId", () => {
    it("should get all projects for a user", async () => {
      // Create multiple projects
      await request(app).post("/projects").send({
        name: "Project 1",
        description: "First project",
        userId: userId,
      });

      await request(app).post("/projects").send({
        name: "Project 2",
        description: "Second project",
        userId: userId,
      });

      // Get user's projects
      const response = await request(app).get(`/projects/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe("Project 1");
      expect(response.body[1].name).toBe("Project 2");
    });

    it("should return empty array for user with no projects", async () => {
      // Create another user with unique email
      const userResponse = await request(app)
        .post("/users")
        .send({
          name: "Jane Doe",
          email: `jane-${Date.now()}@example.com`,
        });

      const response = await request(app).get(`/projects/${userResponse.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });
});
