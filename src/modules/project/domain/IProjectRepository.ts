import { Project } from "./Project.js";

export interface IProjectRepository {
  findAllByUserId(userId: string): Promise<Project[]>;
  save(project: Project): Promise<Project>;
  // findById(id: string): Promise<Project | null>;
  // findAll(): Promise<Project[]>;
}
