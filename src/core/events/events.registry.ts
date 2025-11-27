import { registry } from "tsyringe";
import { TOKENS } from "../di/tokens.js";
import { eventBus } from "./event-bus.js";

@registry([
  {
    token: TOKENS.EventBus,
    useValue: eventBus,
  },
])
export class EventsRegistry {}
