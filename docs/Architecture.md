# Architecture Overview

## Clean Architecture Layers

This project implements **Clean Architecture** with the following layers:

### 1. Domain Layer (`modules/*/domain`)

**Purpose**: Business entities and rules

**Contains**:
- Entities (e.g., `User`)
- Repository interfaces (e.g., `IUserRepository`)
- Domain errors

**Dependencies**: None (pure business logic)

**Example**:
```typescript
// User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string
  ) {}
}
```

### 2. Application Layer (`modules/*/application`)

**Purpose**: Use cases and business workflows

**Contains**:
- Use case implementations (e.g., `CreateUser`, `GetUserById`)
- Use case interfaces (e.g., `ICreateUser`)

**Dependencies**: Domain layer only

**Example**:
```typescript
// CreateUser.ts
@injectable()
export class CreateUser implements ICreateUser {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository
  ) {}

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

### 3. Infrastructure Layer (`modules/*/infrastructure`)

**Purpose**: External concerns (HTTP, DB, DI)

**Contains**:
- Controllers (HTTP handlers)
- Repository implementations (e.g., `TypeOrmUserRepository`)
- DI registries

**Dependencies**: Application and Domain layers

**Example**:
```typescript
// TypeOrmUserRepository.ts
export class TypeOrmUserRepository implements IUserRepository {
  private repository = AppDataSource.getRepository(UserEntity);

  async save(user: User): Promise<User> {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.name = user.name;
    entity.email = user.email;
    await this.repository.save(entity);
    return user;
  }
}
```

### 4. Core Layer (`core/`)

**Purpose**: Cross-cutting concerns

**Contains**:
- DI tokens
- Base error classes
- Logging interfaces
- CLI utilities

**Dependencies**: None

## Dependency Flow

```
┌─────────────────┐
│  Infrastructure │ ──┐
└─────────────────┘   │
                      ▼
┌─────────────────┐   │
│   Application   │ ──┘
└─────────────────┘   │
                      ▼
┌─────────────────┐   │
│     Domain      │ ──┘
└─────────────────┘

        Core (Independent)
```

**Rule**: Inner layers never depend on outer layers.

## Module Communication

Modules communicate via **public APIs**:

```typescript
// User module exposes IUserPublicApi
export interface IUserPublicApi {
  getUserById(id: string): Promise<UserPublicDto | null>;
}

// Greeting module depends on the interface
@injectable()
export class GreetUser {
  constructor(
    @inject(TOKENS.UserPublicApi) private userApi: IUserPublicApi
  ) {}

  async execute(userId: string): Promise<string> {
    const user = await this.userApi.getUserById(userId);
    return user ? `Hello, ${user.name}!` : "Hello, Guest!";
  }
}
```

## Benefits

1. **Testability**: Use cases can be tested with mocks
2. **Flexibility**: Swap implementations (e.g., DB) without changing business logic
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Add new modules without affecting existing ones
