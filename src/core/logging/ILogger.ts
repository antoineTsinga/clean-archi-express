import { LogContext } from "./LogContext.js";

export interface ILogger {
  /**
   * Create child Logger with additional context
   * (requestId, feature, userId, etc.).
   */
  child(bindings: Partial<LogContext>): ILogger;

  debug(message: string, meta?: Partial<LogContext>): void;
  info(message: string, meta?: Partial<LogContext>): void;
  warn(message: string, meta?: Partial<LogContext>): void;
  error(message: string, meta?: Partial<LogContext>): void;
}
