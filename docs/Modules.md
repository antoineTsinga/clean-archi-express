# Module Structure

## Overview

Each feature is organized as a **module** with its own layers.

> [!NOTE]
> This document presents **one possible implementation** of a modular architecture. Feel free to adapt the structure to your project's specific needs and constraints.

## Modular Monolith Architecture

This project follows a **Modular Monolith** approach:

### What is a Modular Monolith?

A modular monolith is a single deployable application organized into **independent, loosely-coupled modules**. Unlike a traditional monolith where code is tightly coupled, or microservices where each service is deployed separately, a modular monolith provides:

- ✅ **Module Independence** - Each module has its own domain, application, and infrastructure layers
- ✅ **Clear Boundaries** - Modules communicate via well-defined public APIs
- ✅ **Single Deployment** - All modules run in one process (simpler than microservices)
- ✅ **Easy Migration Path** - Modules can be extracted into microservices later if needed

### Module Communication

Modules **never** import directly from each other's internal layers. Instead:

```
❌ BAD: Direct import
greeting/GreetUser.ts → user/application/GetUserById.ts

✅ GOOD: Via public API
greeting/GreetUser.ts → user/public/IUserPublicApi.ts
```

**Example**:
```typescript
// Greeting module depends on User's PUBLIC API only
@injectable()
export class GreetUser implements IGreetUser {
  constructor(
    @inject(TOKENS.UserPublicApi) private userApi: IUserPublicApi
  ) {}

  async execute(userId: string): Promise<string> {
    const user = await this.userApi.getUserById(userId);
    return user ? `Hello, ${user.name}!` : "Hello, Guest!";
  }
}
```

### Benefits

1. **Maintainability** - Changes in one module don't break others
2. **Testability** - Modules can be tested in isolation
3. **Team Scalability** - Different teams can own different modules
4. **Future-Proof** - Easy to extract modules into microservices if needed
5. **Simpler Operations** - Single deployment, shared database, no distributed system complexity

### Module Boundaries

Each module is a **vertical slice** of functionality:

```
User Module (Bounded Context)
├── Domain (entities, business rules)
├── Application (use cases)
├── Infrastructure (DB, HTTP)
└── Public API (contract for other modules)

Greeting Module (Bounded Context)
├── Domain
├── Application (depends on User's public API)
└── Infrastructure
```

### When to Create a New Module?

Create a new module when:
- ✅ The feature represents a distinct **bounded context** (DDD concept)
- ✅ It has its own **business rules** and **entities**
- ✅ It could potentially become a **separate service** in the future
- ✅ Multiple teams might work on different modules

Don't create a module for:
- ❌ Simple CRUD operations without business logic
- ❌ Shared utilities (put these in `core/`)
- ❌ Just to organize code (use folders instead)

## Module Template

```
modules/
└── <module-name>/
    ├── domain/           # Business entities and interfaces
    │   ├── <Entity>.ts
    │   ├── I<Repository>.ts
    │   └── errors/
    ├── application/      # Use cases
    │   ├── I<UseCase>.ts
    │   └── <UseCase>.ts
    ├── infrastructure/   # External concerns
    │   ├── db/          # Repository implementations
    │   ├── http/        # Controllers
    │   └── <Module>.registry.ts
    ├── public/          # Public API (optional)
    │   ├── I<Module>PublicApi.ts
    │   └── <Module>PublicApi.ts
    └── tests/           # Tests (alternative location)
        ├── unit/
        └── integration/
```

### Testing Approach

Tests can be organized in **two ways**:

#### Option 1: Co-located Tests (Current Approach)
Place test files next to the code they test:
```
application/
├── CreateUser.ts
└── CreateUser.spec.ts
```

**Pros**: Easy to find tests, clear what's being tested
**Cons**: Mixes test and production code

#### Option 2: Separate Tests Directory
Place all tests in a dedicated `tests/` folder:
```
tests/
├── unit/
│   └── application/
│       └── CreateUser.spec.ts
└── integration/
    └── http/
        └── UserController.spec.ts
```

**Pros**: Clear separation, easier to exclude from builds
**Cons**: Need to maintain parallel structure

> [!TIP]
> Both approaches are valid. Choose based on your team's preference and project size. For larger projects, a separate `tests/` directory often scales better.

## Example: User Module

```
modules/user/
├── domain/
│   ├── User.ts                    # Entity
│   ├── IUserRepository.ts         # Repository interface
│   └── errors/
│       └── UserErrors.ts          # Domain errors
├── application/
│   ├── ICreateUser.ts             # Use case interface
│   ├── CreateUser.ts              # Use case implementation
│   └── GetUserById.ts
├── infrastructure/
│   ├── db/
│   │   ├── UserEntity.ts          # TypeORM entity
│   │   └── TypeOrmUserRepository.ts
│   ├── http/
│   │   └── UserController.ts      # HTTP handlers
│   └── User.registry.ts           # DI registration
└── public/
    ├── IUserPublicApi.ts          # Public interface
    └── UserPublicApi.ts           # Public implementation
```

## Creating a New Module

### 1. Domain Layer

Define your entity:

```typescript
// domain/MyEntity.ts
export class MyEntity {
  constructor(
    public readonly id: string,
    public readonly name: string
  ) {}
}
```

Define repository interface:

```typescript
// domain/IMyRepository.ts
export interface IMyRepository {
  save(entity: MyEntity): Promise<MyEntity>;
  findById(id: string): Promise<MyEntity | null>;
}
```

### 2. Application Layer

Create use case:

```typescript
// application/ICreateMyEntity.ts
export interface ICreateMyEntity {
  execute(name: string): Promise<MyEntity>;
}

// application/CreateMyEntity.ts
@injectable()
export class CreateMyEntity implements ICreateMyEntity {
  constructor(
    @inject(TOKENS.MyRepository) private repo: IMyRepository
  ) {}

  async execute(name: string): Promise<MyEntity> {
    const entity = new MyEntity(randomUUID(), name);
    return this.repo.save(entity);
  }
}
```

### 3. Infrastructure Layer

Implement repository:

```typescript
// infrastructure/db/TypeOrmMyRepository.ts
export class TypeOrmMyRepository implements IMyRepository {
  // Implementation using TypeORM
}
```

Create controller:

```typescript
// infrastructure/http/MyController.ts
export class MyController {
  static async create(req: Request, res: Response, next: NextFunction) {
    const useCase = container.resolve<ICreateMyEntity>(TOKENS.CreateMyEntity);
    try {
      const result = await useCase.execute(req.body.name);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

Register in DI:

```typescript
// infrastructure/My.registry.ts
@registry([
  {
    token: TOKENS.MyRepository,
    useClass: TypeOrmMyRepository,
  },
  {
    token: TOKENS.CreateMyEntity,
    useClass: CreateMyEntity,
  },
])
export class MyRegistry {}
```

### 4. Add Tokens

```typescript
// core/di/tokens.ts
export const TOKENS = {
  // ...
  MyRepository: Symbol.for("MyRepository"),
  CreateMyEntity: Symbol.for("CreateMyEntity"),
};
```

### 5. Register Routes

```typescript
// infrastructure/httpServer.ts
const { MyController } = await import("@/modules/my/infrastructure/http/MyController.js");
app.post("/my-entities", MyController.create);
```

## Public API (Optional)

If other modules need to access your module:

```typescript
// public/IMyPublicApi.ts
export interface IMyPublicApi {
  getById(id: string): Promise<MyDto | null>;
}

// public/MyPublicApi.ts
@injectable()
export class MyPublicApi implements IMyPublicApi {
  constructor(
    @inject(TOKENS.GetMyEntityById) private getById: GetMyEntityById
  ) {}

  async getById(id: string): Promise<MyDto | null> {
    const entity = await this.getById.execute(id);
    return entity ? { id: entity.id, name: entity.name } : null;
  }
}
```

Register the public API in your DI registry.
