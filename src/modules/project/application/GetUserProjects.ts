import { inject, injectable } from "tsyringe";
import { IProjectRepository } from "../domain/IProjectRepository.js";
import { Project } from "../domain/Project.js";
import { TOKENS } from "@/core/di/tokens.js";
import { IUserPublicApi } from "@modules/user/public/IUserPublicApi.js";

export interface IGetUserProjects {
  execute(userId: string): Promise<Project[]>;
}

@injectable()
export class GetUserProjects implements IGetUserProjects {
  constructor(
    @inject(TOKENS.ProjectRepository) private readonly repository: IProjectRepository,
    @inject(TOKENS.UserPublicApi) private readonly getUserById: IUserPublicApi
  ) {}

  async execute(userId: string): Promise<Project[]> {
    const user = await this.getUserById.getUserById(userId);

    if (!user) {
      return [];
    }
    return this.repository.findAllByUserId(user.id);
  }
}
