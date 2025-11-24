# Validation

We use **Zod** for runtime request validation. This ensures that incoming data matches our DTO expectations before reaching the controller.

## How it works

1. **Define a Schema**: Create a Zod schema in your module's `dtos` folder.
2. **Apply Middleware**: Use `validateRequest(schema)` in your router.

## Example

### 1. Define Schema (`CreateUserDto.ts`)

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
});

export type CreateUserDto = z.infer<typeof createUserSchema>["body"];
```

### 2. Apply in Router (`UserRouter.ts`)

```typescript
userRouter.post("/", validateRequest(createUserSchema), UserController.create);
```

## Error Handling

If validation fails, the middleware returns a `400 Bad Request` with a structured error response containing details about which fields failed.
