import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../domain/IUserRepository.js";
import { User } from "../domain/User.js";
import { randomUUID } from "crypto";
import { TOKENS } from "@/core/di/tokens.js";

import { ICreateUser } from "./ICreateUser.js";
import { UserAlreadyExistsError } from "../domain/errors/UserErrors.js";

@injectable()
export class CreateUser implements ICreateUser {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository
  ) {}

  async execute(name: string, email: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError(email);
    }

    const user = new User(randomUUID(), name, email);
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }
}
