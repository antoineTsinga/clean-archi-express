import { inject, injectable } from "tsyringe";
import { IProjectRepository } from "../domain/IProjectRepository.js";
import { Project } from "../domain/Project.js";
import { TOKENS } from "@/core/di/tokens.js";

@injectable()
export class CreateProject implements ICreateProject {
  constructor(@inject(TOKENS.ProjectRepository) private repository: IProjectRepository) {}

  async execute(name: string, description: string, userId: string): Promise<Project> {
    // Logic: ID generation could be here or in repo, usually here for pure domain
    const id = crypto.randomUUID();
    const project = new Project(id, name, description, userId);
    return this.repository.save(project);
  }
}

export interface ICreateProject {
  execute(name: string, description: string, userId: string): Promise<Project>;
}
