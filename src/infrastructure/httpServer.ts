import express from "express";
import { container } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";
import { ILogger } from "@/core/logging/ILogger.js";
import { setupGlobalErrorHandlers } from "@/core/logging/setupGlobalErrorHandlers.js";
import { printStartupCli } from "@/core/cli/startupBanner.js";
import { IHttpRequestLogger } from "./http/interfaces/IHttpRequestLogger.js";
import { attachRequestLogger } from "./http/middleware/request-logger.middleware.js";
import { errorMiddleware } from "./http/middleware/error.middleware.js";
import { HttpSecurityBuilder } from "@/infrastructure/security/SecurityFilterChain.js";
import { helmetMiddleware } from "@/infrastructure/security/middleware/helmet.middleware.js";
import { corsMiddleware } from "@/infrastructure/security/middleware/cors.middleware.js";
import { rateLimitMiddleware } from "@/infrastructure/security/middleware/rateLimit.middleware.js";

export async function createApp() {
  // 1. Handlers globaux
  setupGlobalErrorHandlers();

  // Initialize DB
  const { AppDataSource } = await import("./db/db.js");
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const app = express();
  app.set("trust proxy", true);

  // 2. Security Filter Chain
  const securityFilterChain = new HttpSecurityBuilder()
    .addFilter(helmetMiddleware())
    .addFilter(corsMiddleware())
    .addFilter(rateLimitMiddleware())
    .authorizeHttpRequests((auth) => {
      auth.requestMatchers("/health").permitAll();
      auth.requestMatchers("/users").permitAll(); // Public for demo
      auth.requestMatchers("/projects").permitAll(); // Public for demo
      auth.requestMatchers("/greet/*").permitAll(); // Public for demo
      auth.requestMatchers("/admin/**").authenticated(); // Example
    })
    .build();

  app.use(securityFilterChain.getMiddleware());

  // 3. HTTP logging
  const httpRequestLogger = container.resolve<IHttpRequestLogger>(TOKENS.HttpRequestLogger);
  app.use(httpRequestLogger.getMiddleware());

  // 4. Logger par requête
  app.use(attachRequestLogger);

  // 5. Body parsing
  app.use(express.json());

  // 6. Routes
  app.get("/", (req, res) => {
    req.logger.info("Handling root route", { context: "RootHandler" });
    res.send("OK");
  });

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
  });

  app.get("/error", () => {
    throw new Error("Simulated error for testing purposes");
  });

  // User Routes
  const { userRouter } = await import("@/modules/user/infrastructure/http/UserRouter.js");
  app.use("/users", userRouter);

  // Project Routes
  const { projectRouter } = await import("@/modules/project/infrastructure/http/ProjectRouter.js");
  app.use("/projects", projectRouter);

  // 7. Middleware d’erreur
  app.use(errorMiddleware);

  return app;
}

export async function startHttp(port = 3000) {
  const bootStart = Date.now();
  const app = await createApp();

  // 8. Démarrage du serveur
  const appLogger = container.resolve<ILogger>(TOKENS.Logger);
  const env = process.env.NODE_ENV || "development";
  const host = process.env.HOST || "localhost";
  const appName = process.env.APP_NAME || "My Awesome API";
  const version = process.env.APP_VERSION || "1.0.0";

  // 8. Vérification du port
  const { isPortAvailable } = await import("./utils/portUtils.js");
  if (!(await isPortAvailable(port))) {
    appLogger.error(`Port ${port} is already in use. Please free the port or use another one.`, {
      context: "Bootstrap",
      port,
    });
    process.exit(1);
  }

  // Initialize DB for logging purposes if needed (already done in createApp)
  const { AppDataSource } = await import("./db/db.js");

  const server = app.listen(port, () => {
    const bootTimeMs = Date.now() - bootStart;

    // Banner CLI friendly
    printStartupCli({
      appName,
      version,
      env,
      port,
      host,
      bootTimeMs,
      dbType: AppDataSource.options.type,
      dbAddress:
        typeof AppDataSource.options.database === "string"
          ? AppDataSource.options.database
          : "unknown",
    });

    // Log technique via ILogger
    appLogger.info("Server listening", {
      context: "Bootstrap",
      port,
      env,
      host,
      bootTimeMs,
    });
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    appLogger.info(`${signal} received. Starting graceful shutdown...`, { context: "Shutdown" });

    // 1. Stop accepting new connections
    server.close(async () => {
      appLogger.info("HTTP server closed.", { context: "Shutdown" });

      // 2. Close DB connection
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        appLogger.info("Database connection closed.", { context: "Shutdown" });
      }

      appLogger.info("Graceful shutdown completed. Bye!", { context: "Shutdown" });
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      appLogger.error("Forcing shutdown after timeout.", { context: "Shutdown" });
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGUSR2", () => shutdown("SIGUSR2"));
}
