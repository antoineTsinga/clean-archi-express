import { EventEmitter } from "events";
import { DomainEvent } from "./domain-events.js";

export class EventBus extends EventEmitter {
  emitEvent(event: DomainEvent) {
    this.emit(event.type, event.payload);
  }

  onEvent<T extends DomainEvent["type"]>(
    type: T,
    handler: (payload: Extract<DomainEvent, { type: T }>["payload"]) => void | Promise<void>
  ) {
    this.on(type, handler as any);
  }
}

export const eventBus = new EventBus();
