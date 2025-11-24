import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetUserById } from "@modules/user/application/GetUserById.js";
import { IUserRepository } from "@modules/user/domain/IUserRepository.js";
import { User } from "@modules/user/domain/User.js";

describe("GetUserById Use Case", () => {
  let getUserById: GetUserById;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };
    getUserById = new GetUserById(mockUserRepository);
  });

  it("should return user if found", async () => {
    const userId = "user-123";
    const mockUser = new User(userId, "John Doe", "john@example.com");
    (mockUserRepository.findById as any).mockResolvedValue(mockUser);

    const user = await getUserById.execute(userId);

    expect(user).toEqual(mockUser);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });

  it("should return null if not found", async () => {
    const userId = "user-unknown";
    (mockUserRepository.findById as any).mockResolvedValue(null);

    const user = await getUserById.execute(userId);

    expect(user).toBeNull();
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });
});
