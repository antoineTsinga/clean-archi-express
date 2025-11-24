import "reflect-metadata";
import { DataSource } from "typeorm";
import { container } from "tsyringe";
import { UserEntity } from "@/modules/user/infrastructure/db/UserEntity.js";
import { ProjectEntity } from "@/modules/project/infrastructure/db/ProjectEntity.js";
import { TOKENS } from "@/core/di/tokens.js";
import { CreateUser } from "@/modules/user/application/CreateUser.js";
import { GetUserById } from "@/modules/user/application/GetUserById.js";
import { CreateProject } from "@/modules/project/application/CreateProject.js";
import { GetUserProjects } from "@/modules/project/application/GetUserProjects.js";
import { UserPublicApi } from "@/modules/user/public/UserPublicApi.js";
import { setDataSource } from "@/infrastructure/db/db.js";

let testDataSource: DataSource;

export async function setupIntegrationTest() {
  // Destroy previous database if it exists
  if (testDataSource?.isInitialized) {
    await testDataSource.destroy();
  }

  // Create in-memory database
  testDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    entities: [UserEntity, ProjectEntity],
    synchronize: true,
    logging: false,
  });

  await testDataSource.initialize();

  // Set the test DataSource for repositories to use
  setDataSource(testDataSource);

  // Clear container
  container.clearInstances();
  container.reset();

  // Import repositories
  const { TypeOrmUserRepository } = await import(
    "@/modules/user/infrastructure/db/TypeOrmUserRepository.js"
  );
  const { TypeOrmProjectRepository } = await import(
    "@/modules/project/infrastructure/db/TypeOrmProjectRepository.js"
  );

  // Register repositories
  const userRepository = new TypeOrmUserRepository();
  const projectRepository = new TypeOrmProjectRepository();

  container.registerInstance(TOKENS.UserRepository, userRepository);
  container.registerInstance(TOKENS.ProjectRepository, projectRepository);

  // Register use cases
  container.registerSingleton(TOKENS.CreateUser, CreateUser);
  container.registerSingleton(TOKENS.GetUserById, GetUserById);
  container.registerSingleton(TOKENS.UserPublicApi, UserPublicApi);
  container.registerSingleton(TOKENS.CreateProject, CreateProject);
  container.registerSingleton(TOKENS.GetUserProjects, GetUserProjects);

  // Mock logger
  const mockLogger = {
    info: () => {},
    error: () => {},
    warn: () => {},
    child: function () {
      return this;
    },
    getMiddleware: () => (req: any, res: any, next: any) => {
      req.logger = mockLogger;
      next();
    },
  };
  container.register(TOKENS.Logger, { useValue: mockLogger });
  container.register(TOKENS.HttpRequestLogger, { useValue: mockLogger });

  return testDataSource;
}

export async function teardownIntegrationTest() {
  if (testDataSource?.isInitialized) {
    // Clear all data before destroying
    const entities = testDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = testDataSource.getRepository(entity.name);
      await repository.clear();
    }
    await testDataSource.destroy();
  }
  container.clearInstances();
  container.reset();
}

export function getTestDataSource() {
  return testDataSource;
}
