const { Project, User, ProjectMember } = require('../models');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

class ProjectService {
  async createProject(data, userId) {
    try {
      const project = await Project.create({
        ...data,
        ownerId: userId,
        status: 'active',
      });

      // Add creator as project owner
      await ProjectMember.create({
        projectId: project.id,
        userId,
        role: 'owner',
      });

      return project;
    } catch (error) {
      logger.error('Error creating project:', error);
      throw new AppError('Failed to create project', 500);
    }
  }

  async getProjects({ page, limit, search, status, userId }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
      }
      if (status) {
        where.status = status;
      }

      const { rows, count } = await Project.findAndCountAll({
        where,
        limit,
        offset,
        include: [
          {
            model: ProjectMember,
            where: { userId },
            required: true,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return {
        projects: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching projects:', error);
      throw new AppError('Failed to fetch projects', 500);
    }
  }

  async getProjectById(projectId, userId) {
    try {
      const project = await Project.findOne({
        where: { id: projectId },
        include: [
          {
            model: ProjectMember,
            where: { userId },
            required: true,
          },
        ],
      });

      if (!project) {
        throw new AppError('Project not found or access denied', 404);
      }

      return project;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching project:', error);
      throw new AppError('Failed to fetch project', 500);
    }
  }

  async updateProject(projectId, data, userId) {
    try {
      const project = await this.getProjectById(projectId, userId);
      await project.update(data);
      return project;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating project:', error);
      throw new AppError('Failed to update project', 500);
    }
  }

  async deleteProject(projectId, userId) {
    try {
      const project = await this.getProjectById(projectId, userId);
      await project.destroy();
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting project:', error);
      throw new AppError('Failed to delete project', 500);
    }
  }

  async getProjectMembers(projectId, userId) {
    try {
      await this.getProjectById(projectId, userId);
      const members = await ProjectMember.findAll({
        where: { projectId },
        include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      });
      return members;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching project members:', error);
      throw new AppError('Failed to fetch project members', 500);
    }
  }

  async addProjectMember(projectId, newUserId, role, userId) {
    try {
      await this.getProjectById(projectId, userId);
      const member = await ProjectMember.create({
        projectId,
        userId: newUserId,
        role,
      });
      return member;
    } catch (error) {
      logger.error('Error adding project member:', error);
      throw new AppError('Failed to add project member', 500);
    }
  }
}

module.exports = new ProjectService();
