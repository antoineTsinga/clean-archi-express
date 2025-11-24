import "reflect-metadata";
import { describe, it, expect, beforeEach } from "vitest";
import { container } from "tsyringe";
import { snapshotContainer } from "@/infrastructure/di/containerIntrospection.js";

describe("containerIntrospection", () => {
  beforeEach(() => {
    container.clearInstances();
    container.reset();
  });

  it("should snapshot container registrations", () => {
    class TestClass {}
    container.register("TestToken", { useClass: TestClass });
    container.register("ValueToken", { useValue: "test-value" });
    container.register("FactoryToken", { useFactory: () => "test-value" });
    container.register("TokenToken", { useToken: "test-value" });

    const snapshot = snapshotContainer(container);

    expect(snapshot.byToken.has("TestToken")).toBe(true);
    expect(snapshot.byToken.get("TestToken")?.[0].providerKind).toBe("class");

    expect(snapshot.byToken.has("ValueToken")).toBe(true);
    expect(snapshot.byToken.get("ValueToken")?.[0].providerKind).toBe("value");

    expect(snapshot.byToken.has("FactoryToken")).toBe(true);
    expect(snapshot.byToken.get("FactoryToken")?.[0].providerKind).toBe("factory");

    expect(snapshot.byToken.has("TokenToken")).toBe(true);
    expect(snapshot.byToken.get("TokenToken")?.[0].providerKind).toBe("token");
  });

  it("should handle empty container", () => {
    const snapshot = snapshotContainer(container);
    expect(snapshot.byToken.size).toBe(0);
  });
});
