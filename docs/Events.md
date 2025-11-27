# Event-Driven Architecture

This document explains how to use the event system for asynchronous communication between modules.

## Overview

The event system enables **decoupled, asynchronous communication** between modules using domain events. This is complementary to the synchronous public API pattern.

## Core Components

### EventBus

The `EventBus` is a singleton instance that manages event publishing and subscription:

```typescript
import { eventBus } from "@/core/events/event-bus.js";

// Emit an event
eventBus.emitEvent({
  type: "user.created",
  payload: { userId: "123", email: "user@example.com" },
});

// Subscribe to an event
eventBus.onEvent("user.created", (payload) => {
  console.log(`User created: ${payload.email}`);
});
```

### Domain Events

All events are defined in `core/events/domain-events.ts` as a discriminated union:

```typescript
export type DomainEvent =
  | {
      type: "user.created";
      payload: {
        userId: string;
        email: string;
      };
    }
  | {
      type: "user.updated";
      payload: {
        userId: string;
      };
    };
// Add more events here
```

> [!IMPORTANT]
> Always add new event types to this union to maintain type safety across the application.

## Usage Patterns

### 1. Emitting Events from Use Cases

Use cases should emit events **after** successfully completing their primary action:

```typescript
@injectable()
export class CreateUser implements ICreateUser {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository,
    @inject(TOKENS.EventBus) private eventBus: EventBus
  ) {}

  async execute(name: string, email: string): Promise<User> {
    // 1. Perform the primary action
    const user = new User(randomUUID(), name, email);
    const savedUser = await this.userRepository.save(user);

    // 2. Emit the event
    this.eventBus.emitEvent({
      type: "user.created",
      payload: {
        userId: savedUser.id,
        email: savedUser.email,
      },
    });

    return savedUser;
  }
}
```

### 2. Creating Event Listeners

Create listener classes in the `infrastructure/listeners` directory of the consuming module:

```typescript
// modules/notifications/infrastructure/listeners/OnUserCreated.ts
@injectable()
export class OnUserCreated {
  constructor(
    @inject(TOKENS.EventBus) private eventBus: EventBus,
    @inject(TOKENS.Logger) private logger: ILogger
  ) {}

  setup() {
    this.eventBus.onEvent("user.created", this.handle.bind(this));
  }

  private async handle(payload: Extract<DomainEvent, { type: "user.created" }>["payload"]) {
    // Handle the event
    this.logger.info(`Sending welcome email to ${payload.email}`);
    // Send email, update analytics, etc.
  }
}
```

### 3. Registering and Initializing Listeners

Register listeners in the module's registry file and initialize them:

```typescript
// modules/notifications/infrastructure/Notifications.registry.ts
import { container, registry } from "tsyringe";
import { OnUserCreated } from "./listeners/OnUserCreated.js";

@registry([
  {
    token: OnUserCreated,
    useClass: OnUserCreated,
  },
])
export class NotificationsRegistry {}

// Initialize listeners after registration
const listener = container.resolve(OnUserCreated);
listener.setup();
```

## Testing

### Unit Testing Listeners

```typescript
describe("OnUserCreated Listener", () => {
  let listener: OnUserCreated;
  let mockEventBus: EventBus;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockEventBus = { onEvent: vi.fn() } as any;
    mockLogger = { info: vi.fn() } as any;
    listener = new OnUserCreated(mockEventBus, mockLogger);
  });

  it("should subscribe to user.created event", () => {
    listener.setup();
    expect(mockEventBus.onEvent).toHaveBeenCalledWith("user.created", expect.any(Function));
  });
});
```

### Integration Testing

```typescript
it("should trigger notification when user is created", async () => {
  const createUser = container.resolve<CreateUser>(TOKENS.CreateUser);
  const logger = container.resolve<ILogger>(TOKENS.Logger);
  const logSpy = vi.spyOn(logger, "info");

  await createUser.execute("Test User", "test@example.com");

  expect(logSpy).toHaveBeenCalledWith(
    expect.stringContaining("Welcome email sent to test@example.com")
  );
});
```

## Best Practices

1. **Event Naming**: Use past tense for event names (e.g., `user.created`, not `user.create`)
2. **Payload Design**: Keep payloads minimal - include only essential data
3. **Error Handling**: Listeners should handle errors gracefully and not crash the application
4. **Idempotency**: Design listeners to be idempotent when possible
5. **Type Safety**: Always use the discriminated union types for type-safe event handling

## When to Use Events vs Public APIs

| Use Events When                         | Use Public APIs When          |
| --------------------------------------- | ----------------------------- |
| Action is not critical to the main flow | Result is needed immediately  |
| Multiple modules need to react          | Single module needs data      |
| Side effects (emails, notifications)    | Synchronous data retrieval    |
| Audit logging                           | Direct module-to-module calls |

## Example: Notifications Module

The `notifications` module demonstrates the event pattern:

- **Listener**: [OnUserCreated.ts](../src/modules/notifications/infrastructure/listeners/OnUserCreated.ts)
- **Registry**: [Notifications.registry.ts](../src/modules/notifications/infrastructure/Notifications.registry.ts)
- **Tests**: [OnUserCreated.spec.ts](../test/modules/notifications/infrastructure/listeners/OnUserCreated.spec.ts)
