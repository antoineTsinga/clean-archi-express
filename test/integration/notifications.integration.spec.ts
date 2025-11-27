import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { container } from "tsyringe";
import { setupIntegrationTest, teardownIntegrationTest } from "./setup.js";
import { CreateUser } from "@/modules/user/application/CreateUser.js";
import { TOKENS } from "@/core/di/tokens.js";
import { OnUserCreated } from "@/modules/notifications/infrastructure/listeners/OnUserCreated.js";
import { ILogger } from "@/core/logging/ILogger.js";

describe("Notifications Integration", () => {
  beforeEach(async () => {
    await setupIntegrationTest();

    // Register and setup the listener manually for this test
    // In the real app, this is done by Notifications.registry.ts
    container.register(OnUserCreated, { useClass: OnUserCreated });
    const listener = container.resolve(OnUserCreated);
    listener.setup();
  });

  afterEach(async () => {
    await teardownIntegrationTest();
  });

  it("should log a notification when a user is created", async () => {
    const createUser = container.resolve<CreateUser>(TOKENS.CreateUser);
    const logger = container.resolve<ILogger>(TOKENS.Logger);
    const logSpy = vi.spyOn(logger, "info");

    await createUser.execute("Integration User", "integration@example.com");

    // Allow some time for the event to be processed if it were truly async (here it's synchronous EventEmitter)
    // But EventEmitter is synchronous by default in Node.js unless setImmediate is used.
    // Our EventBus implementation uses standard EventEmitter, so it's synchronous.

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Notification] Welcome email sent to integration@example.com")
    );
  });
});
