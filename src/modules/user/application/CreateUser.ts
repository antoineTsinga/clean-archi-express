import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../domain/IUserRepository.js";
import { User } from "../domain/User.js";
import { randomUUID } from "crypto";
import { TOKENS } from "@/core/di/tokens.js";
import { EventBus } from "@/core/events/event-bus.js";

import { ICreateUser } from "./ICreateUser.js";
import { UserAlreadyExistsError } from "../domain/errors/UserErrors.js";

@injectable()
export class CreateUser implements ICreateUser {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository,
    @inject(TOKENS.EventBus) private eventBus: EventBus
  ) {}

  async execute(name: string, email: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError(email);
    }

    const user = new User(randomUUID(), name, email);
    const savedUser = await this.userRepository.save(user);

    this.eventBus.emitEvent({
      type: "user.created",
      payload: {
        userId: savedUser.id,
        email: savedUser.email,
      },
    });

    return savedUser;
  }
}
