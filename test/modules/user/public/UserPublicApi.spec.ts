import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserPublicApi } from "@/modules/user/public/UserPublicApi.js";
import { GetUserById } from "@/modules/user/application/GetUserById.js";
import { User } from "@/modules/user/domain/User.js";

describe("UserPublicApi", () => {
  let userPublicApi: UserPublicApi;
  let mockGetUserById: GetUserById;

  beforeEach(() => {
    mockGetUserById = {
      execute: vi.fn(),
    } as any;
    userPublicApi = new UserPublicApi(mockGetUserById);
  });

  it("should return user dto if found", async () => {
    const user = new User("u1", "John", "john@example.com");
    (mockGetUserById.execute as any).mockResolvedValue(user);

    const result = await userPublicApi.getUserById("u1");

    expect(result).toEqual({
      id: "u1",
      name: "John",
      email: "john@example.com",
    });
  });

  it("should return null if not found", async () => {
    (mockGetUserById.execute as any).mockResolvedValue(null);

    const result = await userPublicApi.getUserById("u1");

    expect(result).toBeNull();
  });
});
