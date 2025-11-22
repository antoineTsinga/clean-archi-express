> [!NOTE]
> This project demonstrates **one possible implementation** of Clean Architecture. Adapt it to your specific needs.

# Clean Architecture Express API

A production-ready Express.js API built with **Clean Architecture** principles, TypeScript.

## 🏗️ Architecture

This project follows **Clean Architecture** with strict layer separation and a **Modular Monolith** approach.

### Modular Monolith

Each feature is organized as an **independent module** with its own domain, application, and infrastructure layers. Modules communicate via **public APIs** only, ensuring loose coupling while maintaining the simplicity of a single deployment.

```
src/
├── core/              # Domain-agnostic utilities
│   ├── di/           # Dependency Injection tokens
│   ├── errors/       # Base error classes
│   ├── logging/      # Logging interfaces
│   └── cli/          # CLI utilities
├── infrastructure/    # External concerns (HTTP, DB, DI)
│   ├── http/         # Express server, middleware
│   ├── db/           # TypeORM configuration
│   └── logging/      # Pino logger implementation
└── modules/          # Feature modules
    ├── user/
    │   ├── domain/       # Entities, interfaces
    │   ├── application/  # Use cases
    │   ├── infrastructure/ # Repositories, controllers
    │   └── public/       # Public API for other modules
    └── greeting/
        ├── application/  # Use cases
        └── infrastructure/ # Controllers, DI
```

## ✨ Features

- ✅ **Clean Architecture** with strict dependency rules
- ✅ **TypeORM** with SQLite (easily swappable)
- ✅ **Dependency Injection** with tsyringe
- ✅ **Structured Error Handling** with custom error classes
- ✅ **Logging** with Pino
- ✅ **Unit Testing** with Vitest
- ✅ **Type Safety** with TypeScript
- ✅ **Auto-registration** of DI containers
- ✅ **Module Communication** via public APIs

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

### Testing

```bash
npm test
```

## 📡 API Endpoints

### Users

- `POST /users` - Create a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```

### Greeting

- `GET /greet/:userId` - Greet a user by ID
  ```json
  {
    "message": "Hello, John Doe!"
  }
  ```

## 🧪 Testing the API

Use the included `api.http` file with the **REST Client** VS Code extension, or use curl:

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Greet the user (replace with actual ID)
curl http://localhost:3000/greet/<user-id>
```

## 🏛️ Architecture Principles

### Dependency Rule

Dependencies flow **inward**:
- `Infrastructure` → `Application` → `Domain`
- `Core` is independent

### Module Communication

Modules communicate via **public APIs**:
- Each module exposes an `IModulePublicApi` interface
- Other modules depend on interfaces, not implementations
- Example: `Greeting` module uses `IUserPublicApi` to fetch user data

### Error Handling

- Custom error classes extend `AppError`
- HTTP middleware catches and formats errors
- Business errors return appropriate status codes (e.g., 409 Conflict)

## 📚 Documentation

See the `docs/` folder for detailed documentation:

- [Architecture Overview](docs/Architecture.md)
- [Module Structure](docs/Modules.md)
- [Error Handling](docs/ErrorHandler.md)
- [Dependency Injection](docs/DependencyInjection.md)

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: SQLite (configurable)
- **DI**: tsyringe
- **Logging**: Pino
- **Testing**: Vitest
- **Build**: tsc + tsc-alias

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm test` - Run unit tests

## 🤝 Contributing

1. Follow Clean Architecture principles
2. Write unit tests for use cases
3. Use dependency injection
4. Document public APIs

## 📄 License

MIT
