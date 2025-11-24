import { describe, it, expect, vi } from "vitest";
import {
  HttpSecurityBuilder,
  AuthenticatedRequest,
} from "@/infrastructure/security/SecurityFilterChain.js";
import { Request, Response } from "express";

describe("SecurityFilterChain", () => {
  it("should allow access if rule matches and predicate returns true", async () => {
    const builder = new HttpSecurityBuilder();
    builder.authorizeHttpRequests((auth) => {
      auth.requestMatchers("/public").permitAll();
    });
    const chain = builder.build();
    const middleware = chain.getMiddleware();

    const req = { path: "/public", auth: {} } as AuthenticatedRequest;
    const res = { headersSent: false } as Response;
    const next = vi.fn();

    await middleware(req as Request, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should deny access if rule matches and predicate returns false", async () => {
    const builder = new HttpSecurityBuilder();
    builder.authorizeHttpRequests((auth) => {
      auth.requestMatchers("/private").authenticated();
    });
    const chain = builder.build();
    const middleware = chain.getMiddleware();

    const req = { path: "/private", auth: {} } as AuthenticatedRequest; // No subject
    const res = { headersSent: false } as Response;
    const next = vi.fn();

    await middleware(req as Request, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("should deny access if defaultDeny is true and no rule matches", async () => {
    const builder = new HttpSecurityBuilder();
    builder.denyAllByDefault();
    const chain = builder.build();
    const middleware = chain.getMiddleware();

    const req = { path: "/unknown", auth: {} } as AuthenticatedRequest;
    const res = { headersSent: false } as Response;
    const next = vi.fn();

    await middleware(req as Request, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("should execute middlewares", async () => {
    const builder = new HttpSecurityBuilder();
    const customMiddleware = vi.fn((req, res, next) => next());
    builder.addFilter(customMiddleware);
    const chain = builder.build();
    const middleware = chain.getMiddleware();

    const req = { path: "/", auth: {} } as AuthenticatedRequest;
    const res = { headersSent: false } as Response;
    const next = vi.fn();

    await middleware(req as Request, res, next);

    expect(customMiddleware).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
