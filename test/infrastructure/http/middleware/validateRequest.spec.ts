import { describe, it, expect, vi } from "vitest";
import { validateRequest } from "@/infrastructure/http/middleware/validateRequest.js";
import { z } from "zod";
import { Request, Response } from "express";

describe("validateRequest Middleware", () => {
  const schema = z.object({
    body: z.object({
      name: z.string(),
    }),
  });

  it("should call next if validation passes", async () => {
    const req = {
      body: { name: "John" },
      query: {},
      params: {},
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await validateRequest(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 400 if validation fails", async () => {
    const req = {
      body: { name: 123 }, // Invalid type
      query: {},
      params: {},
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    await validateRequest(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "Validation failed",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
  it("should pass non-Zod errors to next", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();
    const error = new Error("Unexpected error");

    const throwingSchema = {
      parseAsync: vi.fn().mockRejectedValue(error),
    } as unknown as z.ZodType;

    await validateRequest(throwingSchema)(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
