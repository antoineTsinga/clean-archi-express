import "express-serve-static-core";
import { ILogger } from "@/core/logging/ILogger.ts";

/**
 * Extend module for Request
 */
declare module "express-serve-static-core" {
  interface Request {
    logger: ILogger;
  }
}
