import { User } from "../domain/User.js";

export interface ICreateUser {
  execute(name: string, email: string): Promise<User>;
}
