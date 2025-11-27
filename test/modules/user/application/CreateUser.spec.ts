import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateUser } from "@modules/user/application/CreateUser.js";
import { IUserRepository } from "@modules/user/domain/IUserRepository.js";
import { User } from "@modules/user/domain/User.js";
import { UserAlreadyExistsError } from "@modules/user/domain/errors/UserErrors.js";
import { EventBus } from "@/core/events/event-bus.js";

describe("CreateUser Use Case", () => {
  let createUser: CreateUser;
  let mockUserRepository: IUserRepository;
  let mockEventBus: EventBus;

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };
    mockEventBus = {
      emitEvent: vi.fn(),
    } as any;
    createUser = new CreateUser(mockUserRepository, mockEventBus);
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
    expect(mockEventBus.emitEvent).toHaveBeenCalledWith({
      type: "user.created",
      payload: {
        userId: user.id,
        email: user.email,
      },
    });
  });

  it("should throw if user already exists", async () => {
    // Setup mock behavior
    const existingUser = new User("123", "John Doe", "john@example.com");
    (mockUserRepository.findByEmail as any).mockResolvedValue(existingUser);

    await expect(createUser.execute("Jane Doe", "john@example.com")).rejects.toThrow(
      UserAlreadyExistsError
    );

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("john@example.com");
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
