import helmet from "helmet";
import { RequestHandler } from "express";

export const helmetMiddleware = (): RequestHandler => {
  return helmet();
};
