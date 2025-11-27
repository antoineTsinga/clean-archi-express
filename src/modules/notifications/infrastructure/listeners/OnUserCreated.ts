import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";
import { EventBus } from "@/core/events/event-bus.js";
import { ILogger } from "@/core/logging/ILogger.js";
import { DomainEvent } from "@/core/events/domain-events.js";

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
    this.logger.info(
      `[Notification] Welcome email sent to ${payload.email} (User ID: ${payload.userId})`
    );
  }
}
