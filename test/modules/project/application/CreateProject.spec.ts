import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateProject } from "@modules/project/application/CreateProject.js";
import { IProjectRepository } from "@modules/project/domain/IProjectRepository.js";
import { Project } from "@modules/project/domain/Project.js";

describe("CreateProject Use Case", () => {
  let createProject: CreateProject;
  let mockProjectRepository: IProjectRepository;

  beforeEach(() => {
    mockProjectRepository = {
      save: vi.fn(),
      findAllByUserId: vi.fn(),
    };
    createProject = new CreateProject(mockProjectRepository);
  });

  it("should create a new project and save it", async () => {
    // Setup mock behavior
    (mockProjectRepository.save as any).mockImplementation(async (p: Project) => p);

    const name = "My Project";
    const description = "A cool project";
    const userId = "user-123";

    const project = await createProject.execute(name, description, userId);

    expect(project.name).toBe(name);
    expect(project.description).toBe(description);
    expect(project.userId).toBe(userId);
    expect(project.id).toBeDefined();

    // Verify interactions
    expect(mockProjectRepository.save).toHaveBeenCalledWith(project);
  });
});
