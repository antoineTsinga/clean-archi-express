import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters").nonempty(),
    description: z.string().optional().default(""),
    userId: z.string().nonempty("User ID is required"),
  }),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>["body"];
