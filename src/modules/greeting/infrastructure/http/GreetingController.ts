import { Request, Response } from "express";
import { container } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";
import { IGreetUser } from "@modules/greeting/application/IGreetUser.js";


export class GreetingController {
  static async greet(req: Request, res: Response) {
    const { userId } = req.params;
    const greetUser = container.resolve<IGreetUser>(TOKENS.GreetUser);
    const message = await greetUser.execute(userId);
    req.logger.info("Greeted user", {
      context: "GreetingController",
      userId,
      message,
    });
    res.json({ message });
  }
}
