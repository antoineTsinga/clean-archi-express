import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../domain/IUserRepository.js";
import { User } from "../domain/User.js";
import { TOKENS } from "@/core/di/tokens.js";

@injectable()
export class GetUserById {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository
  ) {}

  async execute(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
