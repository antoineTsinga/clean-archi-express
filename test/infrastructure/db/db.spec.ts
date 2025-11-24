import { describe, it, expect } from "vitest";
import { DataSource } from "typeorm";
import { getDataSource } from "@/infrastructure/db/db.js";

describe("db", () => {
  it("should export AppDataSource instance", () => {
    expect(getDataSource()).toBeInstanceOf(DataSource);
  });

  it("should be configured with sqlite", () => {
    expect(getDataSource().options.type).toBe("sqlite");
    expect(getDataSource().options.database).toBe("database.sqlite");
  });
});
