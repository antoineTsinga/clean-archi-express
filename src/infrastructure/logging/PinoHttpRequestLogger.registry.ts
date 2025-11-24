import { injectable, registry } from "tsyringe";
import { pinoHttp } from "pino-http";
import { RequestHandler, Request, Response } from "express";
import { randomUUID } from "crypto";

import { createBasePinoLogger } from "./pinoConfig.js";
import { TOKENS } from "@/core/di/tokens.js";
import { IHttpRequestLogger } from "@/infrastructure/http/interfaces/IHttpRequestLogger.js";

type HighResTime = bigint;

@registry([
  {
    token: TOKENS.HttpRequestLogger,
    useClass: PinoHttpRequestLogger,
  },
])
@injectable()
export class PinoHttpRequestLogger implements IHttpRequestLogger {
  private readonly middleware: RequestHandler;

  constructor() {
    const logger = createBasePinoLogger().child({ context: "HTTPLogger" });

    this.middleware = pinoHttp({
      logger,
      genReqId: this.genReqId,
      customReceivedMessage: this.customReceivedMessage,
      customSuccessMessage: this.customSuccessMessage,
      customErrorMessage: this.customErrorMessage,
      serializers: {
        req: () => undefined,
        res: () => undefined,
        responseTime: () => undefined,
      },
      customLogLevel: function (_req, res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return "warn";
        } else if (res.statusCode >= 500 || err) {
          return "error";
        }
        return "info";
      },
    }) as unknown as RequestHandler;
  }

  public getMiddleware(): RequestHandler {
    return this.middleware;
  }

  // ---------- Private helpers ----------

  private genReqId(req: Request, res: Response): string {
    const existing = req.id || req.headers["x-request-id"];
    if (existing && typeof existing === "string") {
      return existing;
    }

    const id = randomUUID().slice(0, 8); // 07738a81
    res.setHeader("X-Request-Id", id);
    return id;
  }

  private customReceivedMessage(req: Request, _res: Response): string {
    // on stocke un startAt haute résolution sur la requête
    const reqAny = req as any;
    reqAny._startAt = process.hrtime.bigint() as HighResTime;

    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "-";

    const path = req.originalUrl || req.url;

    // pino-http rajoutera le niveau etc., ici on se consacre au message
    return `(#${reqAny.id}) Started ${req.method} ${path} for ${ip}`;
  }

  private customSuccessMessage(req: Request, res: Response): string {
    const reqAny = req as any;
    const end = process.hrtime.bigint();
    const start: HighResTime = reqAny._startAt ?? end;
    const diffMs = Number(end - start) / 1e6;

    const length = res.getHeader("content-length") ?? 0;

    return `(#${reqAny.id}) Completed ${res.statusCode} ${length} in ${diffMs.toFixed(3)} ms`;
  }

  private customErrorMessage(req: Request, res: Response, err: Error): string {
    const reqAny = req as any;
    const end = process.hrtime.bigint();
    const start: HighResTime = reqAny._startAt ?? end;
    const diffMs = Number(end - start) / 1e6;

    const length = res.getHeader("content-length") ?? 0;

    return `(#${reqAny.id}) Error ${res.statusCode} ${length} in ${diffMs.toFixed(3)} ms - ${
      err?.message ?? "unknown error"
    }`;
  }
}
