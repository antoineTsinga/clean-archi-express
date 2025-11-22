import { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/errors/AppError.js";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    req.logger.warn("Business error", {
      context: "BusinessError",
      code: err.code,
      message: err.message,
    });
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  const error =
    err instanceof Error
      ? err
      : new Error(typeof err === "string" ? err : "Unknown error");

  req.logger.error("Unhandled application error", {
    context: "ExpressError",
    method: req.method,
    path: req.originalUrl,
    error: error.message,
    stack: error.stack,
  });

  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
}
