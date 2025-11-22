import { NextFunction, Request, Response } from "express";
import { container } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";
import { ICreateUser } from "@modules/user/application/ICreateUser.js";

export class UserController {
  static async create(req: Request, res: Response, next: NextFunction) {
    const { name, email } = req.body;
    const createUser = container.resolve<ICreateUser>(TOKENS.CreateUser);

    try {
      const user = await createUser.execute(name, email);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
}
