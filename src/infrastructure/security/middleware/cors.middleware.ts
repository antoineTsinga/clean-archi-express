import cors from "cors";
import { RequestHandler } from "express";

export const corsMiddleware = (): RequestHandler => {
  return cors();
};
