# Dependency Injection

This project uses **tsyringe** for dependency injection.

## Auto-Registration

DI containers are automatically registered on startup via `@registry` decorators.

### Registry Files

Each module has a `*.registry.ts` file:

```typescript
// User.registry.ts
import { registry } from "tsyringe";
import { TOKENS } from "@/core/di/tokens.js";
import { TypeOrmUserRepository } from "./db/TypeOrmUserRepository.js";
import { CreateUser } from "../application/CreateUser.js";

@registry([
  {
    token: TOKENS.UserRepository,
    useClass: TypeOrmUserRepository,
  },
  {
    token: TOKENS.CreateUser,
    useClass: CreateUser,
  },
])
export class UserRegistry {}
```

### Auto-Discovery

The `autoRegister` function scans `src/` for:

- `*.registry.ts`
- `*.registrar.ts`
- `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.usecases.ts`

It imports these files to trigger the `@registry` decorators.

## Tokens

Tokens are defined in `core/di/tokens.ts`:

```typescript
export const TOKENS = {
  Logger: Symbol.for("Logger"),
  HttpRequestLogger: Symbol.for("HttpRequestLogger"),
  UserRepository: Symbol.for("UserRepository"),
  CreateUser: Symbol.for("CreateUser"),
  // ...
};
```

**Why Symbols?** They ensure unique identifiers and prevent naming collisions.

## Injection Patterns

### Constructor Injection

```typescript
@injectable()
export class CreateUser {
  constructor(@inject(TOKENS.UserRepository) private userRepository: IUserRepository) {}
}
```

### Manual Resolution

```typescript
const createUser = container.resolve<ICreateUser>(TOKENS.CreateUser);
const user = await createUser.execute("John", "john@example.com");
```

## Best Practices

1. **Prefer inject interfaces**, not concrete classes
2. **Use tokens** from `TOKENS` constant
3. **Mark classes as `@injectable()`** if they have dependencies
4. **Register in `*.registry.ts`** files for auto-discovery

## Testing with DI

Use mocks in tests:

```typescript
const mockRepository: IUserRepository = {
  save: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
};

const createUser = new CreateUser(mockRepository);
```

No need to configure the DI container in tests!
