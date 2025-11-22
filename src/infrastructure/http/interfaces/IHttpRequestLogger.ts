import { RequestHandler } from "express";

export interface IHttpRequestLogger {
  /**
   * Return middleware Express to log HTTP request
   */
  getMiddleware(): RequestHandler;
}
