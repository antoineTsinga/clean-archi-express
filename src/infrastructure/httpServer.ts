import express from "express";
import { container } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";
import { ILogger } from "@/core/logging/ILogger.js";
import { setupGlobalErrorHandlers } from "@/core/logging/setupGlobalErrorHandlers.js";
import { printStartupCli } from "@/core/cli/startupBanner.js";
import { IHttpRequestLogger } from "./http/interfaces/IHttpRequestLogger.js";
import { attachRequestLogger } from "./http/request-logger.middleware.js";
import { errorMiddleware } from "./http/error.middleware.js";

export async function startHttp(port = 3000) {
  const bootStart = Date.now();

  // 1. Handlers globaux
  setupGlobalErrorHandlers();

  // Initialize DB
  const { AppDataSource } = await import("./db/db.js");
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const app = express();
  app.set("trust proxy", true);

  // 2. HTTP logging
  const httpRequestLogger = container.resolve<IHttpRequestLogger>(
    TOKENS.HttpRequestLogger
  );
  app.use(httpRequestLogger.getMiddleware());

  // 3. Logger par requête
  app.use(attachRequestLogger);

  // 4. Body parsing
  app.use(express.json());

  // 5. Routes
  app.get("/", (req, res) => {
    req.logger.info("Handling root route", { context: "RootHandler" });
    res.send("OK");
  });

  app.get("/error", (req, res) => {
    throw new Error("Simulated error for testing purposes");
  });

  // User Routes
  const { UserController } = await import("@/modules/user/infrastructure/http/UserController.js");
  app.post("/users", UserController.create);

  // Greeting Routes
  const { GreetingController } = await import("@/modules/greeting/infrastructure/http/GreetingController.js");
  app.get("/greet/:userId", GreetingController.greet);

  // 6. Middleware d’erreur
  app.use(errorMiddleware);

  // 7. Démarrage du serveur
  const appLogger = container.resolve<ILogger>(TOKENS.Logger);
  const env = process.env.NODE_ENV || "development";
  const host = process.env.HOST || "localhost";
  const appName = process.env.APP_NAME || "My Awesome API";
  const version = process.env.APP_VERSION || "1.0.0";

  app.listen(port, () => {
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
      dbAddress: typeof AppDataSource.options.database === "string" ? AppDataSource.options.database : "unknown",
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
}
