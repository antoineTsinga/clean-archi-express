import { AppError } from "@/core/errors/AppError.js";

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 409, "USER_ALREADY_EXISTS");
  }
}
