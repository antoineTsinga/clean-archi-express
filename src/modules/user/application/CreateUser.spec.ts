import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateUser } from "./CreateUser.js";
import { IUserRepository } from "../domain/IUserRepository.js";
import { User } from "../domain/User.js";
import { UserAlreadyExistsError } from "../domain/errors/UserErrors.js";

describe("CreateUser Use Case", () => {
  let createUser: CreateUser;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };
    createUser = new CreateUser(mockUserRepository);
  });

  it("should create a new user", async () => {
    // Setup mock behavior
    (mockUserRepository.findByEmail as any).mockResolvedValue(null);
    (mockUserRepository.save as any).mockImplementation(async (u: User) => u);

    const user = await createUser.execute("John Doe", "john@example.com");

    expect(user.name).toBe("John Doe");
    expect(user.email).toBe("john@example.com");
    expect(user.id).toBeDefined();

    // Verify interactions
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("john@example.com");
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });

  it("should throw if user already exists", async () => {
    // Setup mock behavior
    const existingUser = new User("123", "John Doe", "john@example.com");
    (mockUserRepository.findByEmail as any).mockResolvedValue(existingUser);

    await expect(
      createUser.execute("Jane Doe", "john@example.com")
    ).rejects.toThrow(UserAlreadyExistsError);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("john@example.com");
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
