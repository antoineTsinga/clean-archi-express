import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { ICreateProject } from "../../application/CreateProject.js";
import { IGetUserProjects } from "../../application/GetUserProjects.js";
import { TOKENS } from "@/core/di/tokens.js";

export class ProjectController {
  static async getProjectsByUserId(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.userId;
    const getUserProjects = container.resolve<IGetUserProjects>(TOKENS.GetUserProjects);
    try {
      const projects = await getUserProjects.execute(userId);
      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    const { name, description, userId } = req.body;
    const createProject = container.resolve<ICreateProject>(TOKENS.CreateProject);

    try {
      const project = await createProject.execute(name, description, userId);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
}
