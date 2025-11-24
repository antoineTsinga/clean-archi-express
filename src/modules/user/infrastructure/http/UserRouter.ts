import { Router } from "express";
import { UserController } from "./UserController.js";
import { validateRequest } from "@/infrastructure/http/middleware/validateRequest.js";
import { createUserSchema } from "./dtos/CreateUserDto.js";

const userRouter = Router();

userRouter.post("/", validateRequest(createUserSchema), UserController.create);

export { userRouter };
