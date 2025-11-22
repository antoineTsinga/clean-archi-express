# Error Handling

This project implements **structured error handling** with custom error classes and centralized middleware.

## Architecture

```
Domain Errors → AppError → Error Middleware → HTTP Response
```

## Base Error Class

All application errors extend `AppError`:

```typescript
// core/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "INTERNAL_SERVER_ERROR"
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
```

**Properties**:
- `message`: Human-readable error message
- `statusCode`: HTTP status code (e.g., 400, 404, 409)
- `code`: Machine-readable error code (e.g., "USER_ALREADY_EXISTS")

## Domain-Specific Errors

Each module defines its own errors:

```typescript
// modules/user/domain/errors/UserErrors.ts
import { AppError } from "@/core/errors/AppError.js";

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(
      `User with email ${email} already exists`,
      409,
      "USER_ALREADY_EXISTS"
    );
  }
}

export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(
      `User with ID ${userId} not found`,
      404,
      "USER_NOT_FOUND"
    );
  }
}
```

## Using Errors in Use Cases

Throw domain errors in your use cases:

```typescript
// application/CreateUser.ts
@injectable()
export class CreateUser implements ICreateUser {
  async execute(name: string, email: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    
    if (existingUser) {
      throw new UserAlreadyExistsError(email);
    }
    
    const user = new User(randomUUID(), name, email);
    return this.userRepository.save(user);
  }
}
```

## Error Middleware

The error middleware catches all errors and formats responses:

```typescript
// infrastructure/http/error.middleware.ts
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle AppError instances
  if (err instanceof AppError) {
    req.logger.warn("Business error", {
      context: "BusinessError",
      code: err.code,
      message: err.message,
    });
    
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Handle unexpected errors
  const error = err instanceof Error
    ? err
    : new Error(typeof err === "string" ? err : "Unknown error");

  req.logger.error("Unhandled application error", {
    context: "ExpressError",
    method: req.method,
    path: req.originalUrl,
    error: error.message,
    stack: error.stack,
  });

  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
}
```

## Controller Error Handling

Controllers should **pass errors to `next()`** instead of catching them:

```typescript
// infrastructure/http/UserController.ts
export class UserController {
  static async create(req: Request, res: Response, next: NextFunction) {
    const { name, email } = req.body;
    const createUser = container.resolve<ICreateUser>(TOKENS.CreateUser);

    try {
      const user = await createUser.execute(name, email);
      res.status(201).json(user);
    } catch (error) {
      next(error); // Pass to error middleware
    }
  }
}
```

## HTTP Response Examples

### Success (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Business Error (409 Conflict)
```json
{
  "code": "USER_ALREADY_EXISTS",
  "message": "User with email john@example.com already exists"
}
```

### Unexpected Error (500 Internal Server Error)
```json
{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error"
}
```

## Creating New Error Types

1. **Create the error class**:
```typescript
// modules/mymodule/domain/errors/MyErrors.ts
export class MyCustomError extends AppError {
  constructor(detail: string) {
    super(
      `Something went wrong: ${detail}`,
      400,
      "MY_CUSTOM_ERROR"
    );
  }
}
```

2. **Throw in use case**:
```typescript
if (invalidCondition) {
  throw new MyCustomError("Invalid data");
}
```

3. **No changes needed** - middleware handles it automatically!

## Best Practices

1. ✅ **Use specific error classes** for different error conditions
2. ✅ **Include context** in error messages (e.g., email, ID)
3. ✅ **Use appropriate HTTP status codes**:
   - `400` - Bad Request (validation errors)
   - `404` - Not Found
   - `409` - Conflict (duplicate resource)
   - `500` - Internal Server Error
4. ✅ **Log business errors as warnings**, unexpected errors as errors
5. ✅ **Never expose stack traces** to clients in production
6. ❌ **Don't catch errors in controllers** - let middleware handle them
7. ❌ **Don't use generic `Error`** - create specific error classes

## Testing Errors

```typescript
// CreateUser.spec.ts
it("should throw if user already exists", async () => {
  const existingUser = new User("123", "John Doe", "john@example.com");
  (mockUserRepository.findByEmail as any).mockResolvedValue(existingUser);

  await expect(
    createUser.execute("Jane Doe", "john@example.com")
  ).rejects.toThrow(UserAlreadyExistsError);
});
```

## Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| `USER_ALREADY_EXISTS` | 409 | User with this email already exists |
| `USER_NOT_FOUND` | 404 | User with this ID not found |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

Add your custom error codes to this table as you create them.
