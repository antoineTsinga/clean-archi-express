import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetUserProjects } from "@modules/project/application/GetUserProjects.js";
import { IProjectRepository } from "@modules/project/domain/IProjectRepository.js";
import { IUserPublicApi } from "@modules/user/public/IUserPublicApi.js";
import { Project } from "@modules/project/domain/Project.js";

describe("GetUserProjects Use Case", () => {
  let getUserProjects: GetUserProjects;
  let mockProjectRepository: IProjectRepository;
  let mockUserPublicApi: IUserPublicApi;

  beforeEach(() => {
    mockProjectRepository = {
      save: vi.fn(),
      findAllByUserId: vi.fn(),
    };
    mockUserPublicApi = {
      getUserById: vi.fn(),
    };
    getUserProjects = new GetUserProjects(mockProjectRepository, mockUserPublicApi);
  });

  it("should return projects for a valid user", async () => {
    const userId = "user-123";
    const mockUser = { id: userId, name: "John", email: "john@example.com" };
    const mockProjects = [
      new Project("proj-1", "Project 1", "Desc 1", userId),
      new Project("proj-2", "Project 2", "Desc 2", userId),
    ];

    (mockUserPublicApi.getUserById as any).mockResolvedValue(mockUser);
    (mockProjectRepository.findAllByUserId as any).mockResolvedValue(mockProjects);

    const projects = await getUserProjects.execute(userId);

    expect(projects).toHaveLength(2);
    expect(projects).toEqual(mockProjects);
    expect(mockUserPublicApi.getUserById).toHaveBeenCalledWith(userId);
    expect(mockProjectRepository.findAllByUserId).toHaveBeenCalledWith(userId);
  });

  it("should return empty array if user not found", async () => {
    const userId = "user-unknown";

    (mockUserPublicApi.getUserById as any).mockResolvedValue(null);

    const projects = await getUserProjects.execute(userId);

    expect(projects).toHaveLength(0);
    expect(mockUserPublicApi.getUserById).toHaveBeenCalledWith(userId);
    expect(mockProjectRepository.findAllByUserId).not.toHaveBeenCalled();
  });
});
