import "reflect-metadata";
import { DataSource } from "typeorm";
import { UserEntity } from "@modules/user/infrastructure/db/UserEntity.js";
import { ProjectEntity } from "@modules/project/infrastructure/db/ProjectEntity.js";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  synchronize: true,
  logging: false,
  entities: [UserEntity, ProjectEntity],
});

// Function to get the current DataSource (can be overridden in tests)
let currentDataSource: DataSource = AppDataSource;

export function getDataSource(): DataSource {
  return currentDataSource;
}

export function setDataSource(dataSource: DataSource): void {
  currentDataSource = dataSource;
}
