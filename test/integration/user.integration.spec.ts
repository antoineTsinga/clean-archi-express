import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "@/infrastructure/httpServer.js";
import { setupIntegrationTest, teardownIntegrationTest } from "./setup.js";
import type { Express } from "express";

describe("User API Integration Tests", () => {
  let app: Express;

  beforeEach(async () => {
    await setupIntegrationTest();
    app = await createApp();
  });

  afterEach(async () => {
    await teardownIntegrationTest();
  });

  describe("POST /users", () => {
    it("should create a new user", async () => {
      const response = await request(app).post("/users").send({
        name: "John Doe",
        email: "john@example.com",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("John Doe");
      expect(response.body.email).toBe("john@example.com");
    });

    it("should return 400 for invalid data", async () => {
      const response = await request(app).post("/users").send({
        name: "John Doe",
        // missing email
      });

      expect(response.status).toBe(400);
    });

    it("should return 409 for duplicate email", async () => {
      // Use a unique email for this test to avoid conflicts
      const testEmail = `duplicate-test-${Date.now()}@example.com`;

      // Create first user
      await request(app).post("/users").send({
        name: "John Doe",
        email: testEmail,
      });

      // Try to create duplicate
      const response = await request(app).post("/users").send({
        name: "Jane Doe",
        email: testEmail,
      });

      expect(response.status).toBe(409);
    });
  });
});
