import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .and(z.string().nonempty("Name is required")),
    email: z.string().email("Invalid email address").and(z.string().nonempty("Email is required")),
  }),
});

export type CreateUserDto = z.infer<typeof createUserSchema>["body"];
