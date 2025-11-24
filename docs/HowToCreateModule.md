# How to Create a New Module

This guide walks you through creating a new feature module in the application, following the Modular Monolith architecture.

## 1. Create Directory Structure

Create the following folder structure under `src/modules/<module-name>`:

```
src/modules/<module-name>/
├── domain/           # Entities, Value Objects, Domain Interfaces
├── application/      # Use Cases, DTOs, Application Interfaces
├── infrastructure/   # Repositories, Controllers, HTTP Adapters
└── public/           # Public API for other modules
```

## 2. Define Domain Layer

Create your entities and repository interfaces.

**`domain/MyEntity.ts`**

```typescript
export class MyEntity {
  constructor(
    public readonly id: string,
    public name: string
  ) {}
}
```

**`domain/IMyRepository.ts`**

```typescript
import { MyEntity } from "./MyEntity";

export interface IMyRepository {
  save(entity: MyEntity): Promise<void>;
  findById(id: string): Promise<MyEntity | null>;
}
```

## 3. Define Application Layer

Create your use cases.

**`application/CreateMyEntity.ts`**

```typescript
import { inject, injectable } from "tsyringe";
import { IMyRepository } from "../domain/IMyRepository";
import { MyEntity } from "../domain/MyEntity";

@injectable()
export class CreateMyEntity {
  constructor(@inject("MyRepository") private repository: IMyRepository) {}

  async execute(name: string): Promise<MyEntity> {
    const entity = new MyEntity(crypto.randomUUID(), name);
    await this.repository.save(entity);
    return entity;
  }
}
```

## 4. Implement Infrastructure Layer

Implement the repository and controller.

**`infrastructure/db/TypeOrmMyRepository.ts`**

```typescript
import { IMyRepository } from "../../domain/IMyRepository";
import { MyEntity } from "../../domain/MyEntity";
// ... TypeORM implementation
```

**`infrastructure/http/MyController.ts`**

```typescript
import { Request, Response } from "express";
import { container } from "tsyringe";
import { CreateMyEntity } from "../../application/CreateMyEntity";

export class MyController {
  static async create(req: Request, res: Response) {
    const useCase = container.resolve(CreateMyEntity);
    const result = await useCase.execute(req.body.name);
    res.status(201).json(result);
  }
}
```

## 5. Configure Dependency Injection

Register your implementations.

**`infrastructure/MyModule.registry.ts`**

```typescript
import { registry } from "tsyringe";
import { TypeOrmMyRepository } from "./db/TypeOrmMyRepository";

@registry([
  {
    token: "MyRepository",
    useClass: TypeOrmMyRepository,
  },
])
export class MyModuleRegistry {}
```

## 6. Expose Public API (Optional)

If other modules need to interact with this module, define an interface in `public/`.

**`public/IMyModuleApi.ts`**

```typescript
export interface IMyModuleApi {
  doSomething(): Promise<void>;
}
```

## 7. Register Routes

Add your routes in `src/infrastructure/httpServer.ts` (or a module router).

```typescript
const { MyController } = await import("@/modules/my-module/infrastructure/http/MyController");
app.post("/my-entity", MyController.create);
```
