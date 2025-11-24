import { Router } from "express";
import { ProjectController } from "./ProjectController.js";
import { validateRequest } from "@/infrastructure/http/middleware/validateRequest.js";
import { createProjectSchema } from "./dtos/CreateProjectDto.js";

const projectRouter = Router();

projectRouter.get("/:userId", ProjectController.getProjectsByUserId);

projectRouter.post("/", validateRequest(createProjectSchema), ProjectController.create);

export { projectRouter };
