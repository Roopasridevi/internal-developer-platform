const projectService = require('../../../src/services/projectService');
const { Project, User, ProjectMember } = require('../../../src/models');
const { AppError } = require('../../../src/utils/errors');
const { Op } = require('sequelize');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    /**
     * Test: Should successfully create a project with valid data
     * Scenario: User provides valid project data
     * Expected: Project is created and user is added as owner
     */
    it('should create a project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        description: 'Test Description',
        ownerId: 'user-123',
        status: 'active',
      };

      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
      };

      Project.create = jest.fn().mockResolvedValue(mockProject);
      ProjectMember.create = jest.fn().mockResolvedValue({
        projectId: 'project-123',
        userId: 'user-123',
        role: 'owner',
      });

      const result = await projectService.createProject(projectData, 'user-123');

      expect(result).toEqual(mockProject);
      expect(Project.create).toHaveBeenCalledWith({
        ...projectData,
        ownerId: 'user-123',
        status: 'active',
      });
      expect(ProjectMember.create).toHaveBeenCalledWith({
        projectId: 'project-123',
        userId: 'user-123',
        role: 'owner',
      });
    });

    /**
     * Test: Should handle database errors during project creation
     * Scenario: Database throws an error
     * Expected: AppError is thrown with appropriate message
     */
    it('should throw AppError when project creation fails', async () => {
      Project.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        projectService.createProject({ name: 'Test' }, 'user-123')
      ).rejects.toThrow(AppError);
      await expect(
        projectService.createProject({ name: 'Test' }, 'user-123')
      ).rejects.toThrow('Failed to create project');
    });

    /**
     * Test: Should create project with all optional fields
     * Scenario: User provides all possible project fields
     * Expected: Project is created with all fields
     */
    it('should create project with all optional fields', async () => {
      const projectData = {
        name: 'Full Project',
        description: 'Full Description',
        repositoryUrl: 'https://github.com/test/repo',
        settings: { theme: 'dark' },
      };

      const mockProject = { id: 'project-456', ...projectData, ownerId: 'user-123' };
      Project.create = jest.fn().mockResolvedValue(mockProject);
      ProjectMember.create = jest.fn().mockResolvedValue({});

      const result = await projectService.createProject(projectData, 'user-123');

      expect(result).toEqual(mockProject);
      expect(Project.create).toHaveBeenCalledWith({
        ...projectData,
        ownerId: 'user-123',
        status: 'active',
      });
    });
  });

  describe('getProjects', () => {
    /**
     * Test: Should retrieve paginated projects for a user
     * Scenario: User requests their projects with pagination
     * Expected: Returns projects with pagination metadata
     */
    it('should get projects with pagination', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'Project 1' },
        { id: 'project-2', name: 'Project 2' },
      ];

      Project.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockProjects,
        count: 2,
      });

      const result = await projectService.getProjects({
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(result).toEqual({
        projects: mockProjects,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    /**
     * Test: Should filter projects by search term
     * Scenario: User searches for projects by name
     * Expected: Returns filtered projects matching search term
     */
    it('should filter projects by search term', async () => {
      const mockProjects = [{ id: 'project-1', name: 'Test Project' }];

      Project.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockProjects,
        count: 1,
      });

      await projectService.getProjects({
        page: 1,
        limit: 10,
        search: 'Test',
        userId: 'user-123',
      });

      expect(Project.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { [Op.iLike]: '%Test%' },
          }),
        })
      );
    });

    /**
     * Test: Should filter projects by status
     * Scenario: User filters projects by active status
     * Expected: Returns only active projects
     */
    it('should filter projects by status', async () => {
      Project.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await projectService.getProjects({
        page: 1,
        limit: 10,
        status: 'active',
        userId: 'user-123',
      });

      expect(Project.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        })
      );
    });

    /**
     * Test: Should calculate correct pagination for multiple pages
     * Scenario: User requests page 2 with 10 items per page from 25 total
     * Expected: Returns correct pagination metadata
     */
    it('should calculate correct pagination metadata', async () => {
      Project.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 25,
      });

      const result = await projectService.getProjects({
        page: 2,
        limit: 10,
        userId: 'user-123',
      });

      expect(result.pagination).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    /**
     * Test: Should handle database errors when fetching projects
     * Scenario: Database query fails
     * Expected: AppError is thrown
     */
    it('should throw AppError when fetching projects fails', async () => {
      Project.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        projectService.getProjects({ page: 1, limit: 10, userId: 'user-123' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getProjectById', () => {
    /**
     * Test: Should retrieve a project by ID for authorized user
     * Scenario: User requests a project they have access to
     * Expected: Returns the project details
     */
    it('should get project by id successfully', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);

      const result = await projectService.getProjectById('project-123', 'user-123');

      expect(result).toEqual(mockProject);
      expect(Project.findOne).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        include: [
          {
            model: ProjectMember,
            where: { userId: 'user-123' },
            required: true,
          },
        ],
      });
    });

    /**
     * Test: Should throw error when project not found
     * Scenario: User requests a non-existent project
     * Expected: AppError with 404 status is thrown
     */
    it('should throw AppError when project not found', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        projectService.getProjectById('project-999', 'user-123')
      ).rejects.toThrow(AppError);
      await expect(
        projectService.getProjectById('project-999', 'user-123')
      ).rejects.toThrow('Project not found or access denied');
    });

    /**
     * Test: Should throw error when user lacks access
     * Scenario: User requests a project they don't have access to
     * Expected: AppError with 404 status is thrown
     */
    it('should throw error when user has no access to project', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        projectService.getProjectById('project-123', 'unauthorized-user')
      ).rejects.toThrow('Project not found or access denied');
    });
  });

  describe('updateProject', () => {
    /**
     * Test: Should successfully update a project
     * Scenario: User updates project with valid data
     * Expected: Project is updated and returned
     */
    it('should update project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Old Name',
        update: jest.fn().mockResolvedValue(true),
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);

      const updateData = { name: 'New Name', description: 'Updated' };
      const result = await projectService.updateProject('project-123', updateData, 'user-123');

      expect(mockProject.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockProject);
    });

    /**
     * Test: Should throw error when updating non-existent project
     * Scenario: User tries to update a project that doesn't exist
     * Expected: AppError is thrown
     */
    it('should throw error when project does not exist', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        projectService.updateProject('project-999', { name: 'New' }, 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should handle database errors during update
     * Scenario: Database update operation fails
     * Expected: AppError is thrown
     */
    it('should handle update errors', async () => {
      const mockProject = {
        id: 'project-123',
        update: jest.fn().mockRejectedValue(new Error('Update failed')),
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);

      await expect(
        projectService.updateProject('project-123', { name: 'New' }, 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteProject', () => {
    /**
     * Test: Should successfully delete a project
     * Scenario: User deletes their project
     * Expected: Project is deleted from database
     */
    it('should delete project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        destroy: jest.fn().mockResolvedValue(true),
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);

      await projectService.deleteProject('project-123', 'user-123');

      expect(mockProject.destroy).toHaveBeenCalled();
    });

    /**
     * Test: Should throw error when deleting non-existent project
     * Scenario: User tries to delete a project that doesn't exist
     * Expected: AppError is thrown
     */
    it('should throw error when project does not exist', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        projectService.deleteProject('project-999', 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should handle database errors during deletion
     * Scenario: Database delete operation fails
     * Expected: AppError is thrown
     */
    it('should handle deletion errors', async () => {
      const mockProject = {
        id: 'project-123',
        destroy: jest.fn().mockRejectedValue(new Error('Delete failed')),
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);

      await expect(
        projectService.deleteProject('project-123', 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getProjectMembers', () => {
    /**
     * Test: Should retrieve all project members
     * Scenario: User requests list of project members
     * Expected: Returns array of members with user details
     */
    it('should get project members successfully', async () => {
      const mockProject = { id: 'project-123' };
      const mockMembers = [
        { id: 'member-1', userId: 'user-1', role: 'owner' },
        { id: 'member-2', userId: 'user-2', role: 'developer' },
      ];

      Project.findOne = jest.fn().mockResolvedValue(mockProject);
      ProjectMember.findAll = jest.fn().mockResolvedValue(mockMembers);

      const result = await projectService.getProjectMembers('project-123', 'user-123');

      expect(result).toEqual(mockMembers);
      expect(ProjectMember.findAll).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      });
    });

    /**
     * Test: Should throw error when project doesn't exist
     * Scenario: User requests members of non-existent project
     * Expected: AppError is thrown
     */
    it('should throw error when project does not exist', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        projectService.getProjectMembers('project-999', 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('addProjectMember', () => {
    /**
     * Test: Should successfully add a member to project
     * Scenario: Owner adds a new member to the project
     * Expected: Member is added with specified role
     */
    it('should add project member successfully', async () => {
      const mockProject = { id: 'project-123' };
      const mockMember = {
        id: 'member-123',
        projectId: 'project-123',
        userId: 'user-456',
        role: 'developer',
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);
      ProjectMember.create = jest.fn().mockResolvedValue(mockMember);

      const result = await projectService.addProjectMember(
        'project-123',
        'user-456',
        'developer',
        'user-123'
      );

      expect(result).toEqual(mockMember);
      expect(ProjectMember.create).toHaveBeenCalledWith({
        projectId: 'project-123',
        userId: 'user-456',
        role: 'developer',
      });
    });

    /**
     * Test: Should throw error when project doesn't exist
     * Scenario: User tries to add member to non-existent project
     * Expected: AppError is thrown
     */
    it('should throw error when project does not exist', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        projectService.addProjectMember('project-999', 'user-456', 'developer', 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should handle database errors when adding member
     * Scenario: Database operation fails
     * Expected: AppError is thrown
     */
    it('should handle errors when adding member', async () => {
      const mockProject = { id: 'project-123' };
      Project.findOne = jest.fn().mockResolvedValue(mockProject);
      ProjectMember.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        projectService.addProjectMember('project-123', 'user-456', 'developer', 'user-123')
      ).rejects.toThrow(AppError);
    });
  });
});
