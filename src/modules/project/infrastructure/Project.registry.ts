import { registry } from "tsyringe";
import { TypeOrmProjectRepository } from "./db/TypeOrmProjectRepository.js";
import { TOKENS } from "@/core/di/tokens.js";
import { GetUserProjects } from "../application/GetUserProjects.js";
import { CreateProject } from "../application/CreateProject.js";

@registry([
  {
    token: TOKENS.ProjectRepository,
    useClass: TypeOrmProjectRepository,
  },
  {
    token: TOKENS.GetUserProjects,
    useClass: GetUserProjects,
  },
  {
    token: TOKENS.CreateProject,
    useClass: CreateProject,
  },
])
export class ProjectRegistry {}
