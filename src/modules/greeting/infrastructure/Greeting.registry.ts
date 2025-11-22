import { registry } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";
import { GreetUser } from "../application/GreetUser.js";

@registry([
  {
    token: TOKENS.GreetUser,
    useClass: GreetUser,
  },
])
export class GreetingRegistry {}
