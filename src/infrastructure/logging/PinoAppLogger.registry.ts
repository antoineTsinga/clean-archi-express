import { injectable, registry } from "tsyringe";
import { Logger as PinoLogger } from "pino";

import { createBasePinoLogger } from "./pinoConfig.js";
import { TOKENS } from "@/core/di/tokens.js";
import { LogContext } from "@/core/logging/LogContext.js";
import { ILogger } from "@/core/logging/ILogger.js";

/**
 * App Logger used to log business
 */
@registry([
  {
    token: TOKENS.Logger,
    useFactory: (): PinoAppLogger => PinoAppLogger.createRoot(),
  },
])
@injectable()
export class PinoAppLogger implements ILogger {
  constructor(private readonly logger: PinoLogger) {}

  public static createRoot(): PinoAppLogger {
    const base = createBasePinoLogger();
    return new PinoAppLogger(base);
  }

  child(bindings: Partial<LogContext>): ILogger {
    const childLogger = this.logger.child(bindings);
    return new PinoAppLogger(childLogger);
  }

  debug(message: string, meta?: Partial<LogContext>): void {
    this.logger.debug(meta ?? {}, message);
  }

  info(message: string, meta?: Partial<LogContext>): void {
    this.logger.info(meta ?? {}, message);
  }

  warn(message: string, meta?: Partial<LogContext>): void {
    this.logger.warn(meta ?? {}, message);
  }

  error(message: string, meta?: Partial<LogContext>): void {
    this.logger.error(meta ?? {}, message);
  }
}
