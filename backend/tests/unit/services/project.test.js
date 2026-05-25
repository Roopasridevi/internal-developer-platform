const projectService = require('../../../src/services/projectService');
const { Project, ProjectMember } = require('../../../src/models');

jest.mock('../../../src/models');

describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        ownerId: 'user-123',
      };

      Project.create = jest.fn().mockResolvedValue(mockProject);
      ProjectMember.create = jest.fn().mockResolvedValue({});

      const result = await projectService.createProject(
        { name: 'Test Project' },
        'user-123'
      );

      expect(result).toEqual(mockProject);
      expect(Project.create).toHaveBeenCalled();
      expect(ProjectMember.create).toHaveBeenCalled();
    });
  });
});
