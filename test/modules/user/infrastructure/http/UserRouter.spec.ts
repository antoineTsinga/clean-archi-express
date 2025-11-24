import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { userRouter } from "@/modules/user/infrastructure/http/UserRouter.js";
import { UserController } from "@/modules/user/infrastructure/http/UserController.js";

// Mock the controller methods
vi.mock("@/modules/user/infrastructure/http/UserController.js", () => ({
  UserController: {
    create: vi.fn((req, res) => res.status(201).send()),
  },
}));

describe("UserRouter", () => {
  const app = express();
  app.use(express.json());
  app.use("/users", userRouter);

  it("should route POST / to UserController.create", async () => {
    await request(app).post("/users").send({ name: "John", email: "john@example.com" });

    expect(UserController.create).toHaveBeenCalled();
  });
});
