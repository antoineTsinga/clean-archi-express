import { IProjectRepository } from "../../domain/IProjectRepository.js";
import { Project } from "../../domain/Project.js";
import { ProjectEntity } from "./ProjectEntity.js";
import { getDataSource } from "@/infrastructure/db/db.js";

export class TypeOrmProjectRepository implements IProjectRepository {
  private get repository() {
    return getDataSource().getRepository(ProjectEntity);
  }

  async save(project: Project): Promise<Project> {
    const entity = new ProjectEntity();
    entity.id = project.id;
    entity.name = project.name;
    entity.description = project.description;
    entity.userId = project.userId;
    await this.repository.save(entity);
    return project;
  }

  // async findById(id: string): Promise<Project | null> {
  //   const entity = await this.repository.findOneBy({ id });
  //   if (!entity) return null;
  //   return new Project(entity.id, entity.name, entity.description, entity.userId);
  // }

  // async findAll(): Promise<Project[]> {
  //   const entities = await this.repository.find();
  //   return entities.map(
  //     (entity) => new Project(entity.id, entity.name, entity.description, entity.userId)
  //   );
  // }

  async findAllByUserId(userId: string): Promise<Project[]> {
    const entities = await this.repository.find({ where: { userId } });
    return entities.map(
      (entity) => new Project(entity.id, entity.name, entity.description, entity.userId)
    );
  }
}
