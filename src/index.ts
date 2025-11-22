import "reflect-metadata";
import { autoRegister } from "./infrastructure/di/autoRegister.js";
import { startHttp } from "./infrastructure/httpServer.js";
import { container } from "tsyringe";

async function main() {
  try {
    await autoRegister({
      container, // optionnel, par défaut c’est le rootContainer
    });
    await startHttp();
  } catch (err) {
    console.error("Fatal startup 2 error:", err);
    process.exit(1);
  }
}

main();
