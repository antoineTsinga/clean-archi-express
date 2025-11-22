import { container } from "tsyringe";
import { ILogger } from "./ILogger.js";
import { TOKENS } from "@/core/di/tokens.js";

export function setupGlobalErrorHandlers() {
  const logger = container.resolve<ILogger>(TOKENS.Logger);

  // ------------
  // 1. Uncaught Exception
  // ------------
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught exception", {
      context: "GlobalError",
      error: error.message,
      stack: error.stack,
    });

    // Idéalement : crash volontaire (Node stale)
    process.exit(1);
  });

  // ------------
  // 2. Unhandled Promise Rejection
  // ------------
  process.on("unhandledRejection", (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    logger.error("Unhandled promise rejection", {
      context: "GlobalError",
      error: error.message,
      stack: error.stack,
    });

    // même logique
    process.exit(1);
  });

  // ------------
  // 3. Node warnings (facultatif)
  // ------------
  process.on("warning", (warning) => {
    logger.warn("Node warning", {
      context: "GlobalError",
      error: warning.message,
      stack: warning.stack,
    });
  });

  logger.info("Global error handlers installed", { context: "Bootstrap" });
}
