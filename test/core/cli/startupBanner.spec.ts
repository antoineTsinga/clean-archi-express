import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printStartupCli } from "@/core/cli/startupBanner.js";

describe("printStartupCli", () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print banner with minimal options", () => {
    printStartupCli({
      appName: "TestApp",
      env: "test",
      port: 3000,
      bootTimeMs: 100,
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    const calls = consoleLogSpy.mock.calls.map((c: any[]) => c[0]).join("\n");
    expect(calls).toContain("TestApp");
    expect(calls).toContain("3000");
    expect(calls).toContain("test");
    expect(calls).toContain("100 ms");
  });

  it("should print banner with all options", () => {
    printStartupCli({
      appName: "TestApp",
      version: "1.0.0",
      env: "production",
      port: 8080,
      host: "0.0.0.0",
      bootTimeMs: 250,
      dbType: "postgres",
      dbAddress: "localhost:5432",
      modules: [
        { name: "UserModule", status: "ok", initTimeMs: 50 },
        { name: "ProjectModule", status: "warn", initTimeMs: 30 },
        { name: "AdminModule", status: "error", initTimeMs: 20 },
        { name: "OtherModule" },
      ],
    });

    const calls = consoleLogSpy.mock.calls.map((c: any[]) => c[0]).join("\n");
    expect(calls).toContain("v1.0.0");
    expect(calls).toContain("production");
    expect(calls).toContain("8080");
    expect(calls).toContain("0.0.0.0");
    expect(calls).toContain("postgres");
    expect(calls).toContain("localhost:5432");
    expect(calls).toContain("UserModule");
    expect(calls).toContain("ProjectModule");
    expect(calls).toContain("AdminModule");
    expect(calls).toContain("OtherModule");
  });
});
