import { inject, injectable } from "tsyringe";
import { IGreetUser } from "./IGreetUser.js";
import { TOKENS } from "@/core/di/tokens.js";
import { IUserPublicApi } from "@modules/user/public/IUserPublicApi.js";

@injectable()
export class GreetUser implements IGreetUser {
  constructor(
    @inject(TOKENS.UserPublicApi) private userPublicApi: IUserPublicApi
  ) {}

  async execute(userId: string): Promise<string> {
    const user = await this.userPublicApi.getUserById(userId);
    if (!user) {
      return "Hello, Guest!";
    }
    return `Hello, ${user.name}!`;
  }
}
