import { describe, it, expect, afterEach } from "vitest";
import { isPortAvailable } from "@/infrastructure/utils/portUtils.js";
import net from "net";

describe("portUtils", () => {
  let server: net.Server;

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  it("should return true if port is available", async () => {
    const port = 12345;
    const available = await isPortAvailable(port);
    expect(available).toBe(true);
  });

  it("should return false if port is in use", async () => {
    const port = 12346;
    server = net.createServer();
    await new Promise<void>((resolve) => server.listen(port, resolve));

    const available = await isPortAvailable(port);
    expect(available).toBe(false);
  });
});
