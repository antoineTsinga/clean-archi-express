import { container, registry } from "tsyringe";
import { OnUserCreated } from "./listeners/OnUserCreated.js";

@registry([
  {
    token: OnUserCreated,
    useClass: OnUserCreated,
  },
])
export class NotificationsRegistry {}

// Initialize listeners
// We resolve the listener to ensure it's instantiated and setup() is called.
// This relies on the fact that dependencies (EventBus, Logger) are already registered.
try {
  const listener = container.resolve(OnUserCreated);
  listener.setup();
} catch (error) {
  console.warn("Failed to initialize OnUserCreated listener:", error);
}
