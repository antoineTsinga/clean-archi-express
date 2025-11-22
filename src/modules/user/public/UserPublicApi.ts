import { inject, injectable } from "tsyringe";
import { IUserPublicApi, UserPublicDto } from "./IUserPublicApi.js";
import { GetUserById } from "../application/GetUserById.js";
import { TOKENS } from "@/core/di/tokens.js";

@injectable()
export class UserPublicApi implements IUserPublicApi {
  constructor(
    @inject(TOKENS.GetUserById) private getUserByIdUseCase: GetUserById
  ) {}

  async getUserById(id: string): Promise<UserPublicDto | null> {
    const user = await this.getUserByIdUseCase.execute(id);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
