import { registry } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";

import { TypeOrmUserRepository } from "./db/TypeOrmUserRepository.js";
import { CreateUser } from "../application/CreateUser.js";
import { GetUserById } from "../application/GetUserById.js";
import { UserPublicApi } from "../public/UserPublicApi.js";

@registry([
  {
    token: TOKENS.UserRepository,
    useClass: TypeOrmUserRepository,
  },
  {
    token: TOKENS.CreateUser,
    useClass: CreateUser,
  },
  {
    token: TOKENS.GetUserById,
    useClass: GetUserById,
  },
  {
    token: TOKENS.UserPublicApi,
    useClass: UserPublicApi,
  },
])
export class UserRegistry {}
