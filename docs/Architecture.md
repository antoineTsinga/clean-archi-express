# Architecture Overview

This document details the architectural decisions and patterns used in the project.

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
  constructor(@inject(TOKENS.UserRepository) private userRepository: IUserRepository) {}

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

// Project module depends on the interface
@injectable()
export class GetUserProjects {
  constructor(@inject(TOKENS.UserPublicApi) private userApi: IUserPublicApi) {}

  async execute(userId: string): Promise<Project[]> {
    const user = await this.userApi.getUserById(userId);
    // ...
  }
}
```

## Benefits

1. **Testability**: Use cases can be tested with mocks
2. **Flexibility**: Swap implementations (e.g., DB) without changing business logic
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Add new modules without affecting existing ones

## 🏗️ Modular Monolith Architecture

This project follows a **Modular Monolith** architecture, where the application is structured into independent modules that communicate via public APIs.

### High-Level Structure

```mermaid
graph TD
    subgraph Core [Core Layer]
        DI[Dependency Injection]
        Err[Error Handling]
        Log[Logging]
    end

    subgraph Infra [Infrastructure Layer]
        HTTP[HTTP Server]
        DB[Database / TypeORM]
        Sec[Security]
    end

    subgraph Modules [Feature Modules]
        User[User Module]
        Project[Project Module]
    end

    HTTP --> User
    HTTP --> Project
    User --> Core
    Project --> Core
    User --> DB
    Project --> DB
    Project -.->|Public API| User
```

### Request Walkthrough: `POST /users`

Here is the detailed flow of a request to create a user:

```mermaid
sequenceDiagram
    participant Client
    participant HTTP as HTTP Server (Express)
    participant Sec as Security Filter Chain
    participant Val as Validation Middleware
    participant Ctrl as UserController
    participant UC as CreateUser (Use Case)
    participant Repo as UserRepository
    participant DB as Database

    Client->>HTTP: POST /users {name, email}
    HTTP->>Sec: Check Security (Cors, Helmet, etc.)
    Sec->>Sec: Check Authorization (Predicates)
    Sec->>HTTP: Allowed
    HTTP->>Val: Validate Body (Zod)

    alt Validation Fails
        Val-->>Client: 400 Bad Request
    else Validation OK
        Val->>Ctrl: Forward Request
    end

    Ctrl->>UC: execute(name, email)
    UC->>Repo: save(user)
    Repo->>DB: INSERT INTO users...
    DB-->>Repo: Success
    Repo-->>UC: User Entity
    UC-->>Ctrl: User Entity
    Ctrl-->>Client: 201 Created {id, name, email}
```

1.  **Request**: Client sends `POST /users`.
2.  **Security**: `SecurityFilterChain` applies global middleware (Helmet, CORS, RateLimit) and checks authorization predicates.
3.  **Routing**: Express matches the route.
4.  **Validation**: `validateRequest` middleware checks the body against `createUserSchema`.
5.  **Controller**: `UserController` receives the request and resolves the `CreateUser` use case from the DI container.
6.  **Use Case**: `CreateUser` executes business logic (e.g., check if email exists, create entity).
7.  **Repository**: `UserRepository` persists the entity to the database via TypeORM.
8.  **Response**: The created user is returned to the client.

## 🧱 Module Anatomy

Each module follows Clean Architecture internally:

```mermaid
flowchart TB
    subgraph Module [User Module]
        direction TB
        API[Public API]

        subgraph Domain
            Entity[User Entity]
            RepoInterface[IUserRepository]
        end
        subgraph Application
            IUseCase[ICreateUser]
            UseCase[CreateUser]
            DTO[UserDTO]
        end

        subgraph Infrastructure
            Controller[UserController]
            RepoImpl[TypeOrmUserRepository]
        end

        UseCase --> RepoInterface
        UseCase --> IUseCase
        RepoImpl --> RepoInterface
        Controller --> IUseCase
        UseCase --> Entity
        API --> Application
    end
```
