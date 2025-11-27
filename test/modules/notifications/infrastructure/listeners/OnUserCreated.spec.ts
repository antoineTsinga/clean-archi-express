import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnUserCreated } from "@/modules/notifications/infrastructure/listeners/OnUserCreated.js";
import { EventBus } from "@/core/events/event-bus.js";
import { ILogger } from "@/core/logging/ILogger.js";

describe("OnUserCreated Listener", () => {
  let onUserCreated: OnUserCreated;
  let mockEventBus: EventBus;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockEventBus = {
      onEvent: vi.fn(),
    } as any;

    mockLogger = {
      info: vi.fn(),
    } as any;

    onUserCreated = new OnUserCreated(mockEventBus, mockLogger);
  });

  it("should subscribe to user.created event on setup", () => {
    onUserCreated.setup();
    expect(mockEventBus.onEvent).toHaveBeenCalledWith("user.created", expect.any(Function));
  });

  it("should log message when handling event", async () => {
    // Capture the handler passed to onEvent
    let capturedHandler: ((payload: any) => Promise<void>) | undefined;
    (mockEventBus.onEvent as any).mockImplementation(
      (type: string, handler: (payload: any) => Promise<void>) => {
        capturedHandler = handler;
      }
    );

    onUserCreated.setup();

    expect(capturedHandler).toBeDefined();

    // Simulate event payload
    const payload = {
      userId: "123",
      email: "test@example.com",
    };

    // Invoke the handler
    await capturedHandler!(payload);

    expect(mockLogger.info).toHaveBeenCalledWith(
      `[Notification] Welcome email sent to ${payload.email} (User ID: ${payload.userId})`
    );
  });
});
