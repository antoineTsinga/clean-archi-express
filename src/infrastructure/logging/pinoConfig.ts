import pino from "pino";

export function createBasePinoLogger() {
  const isDev = process.env.NODE_ENV !== "production";
  return pino({
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    transport: isDev
      ? {
          target: "pino-pretty-transport.cjs",
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
            hideObject: true,
          },
        }
      : undefined,
  });
}
