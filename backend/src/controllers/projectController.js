const projectService = require('../services/projectService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class ProjectController {
  async createProject(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const project = await projectService.createProject(req.body, req.user.id);
      logger.info(`Project created: ${project.id}`);
      
      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const projects = await projectService.getProjects({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        status,
        userId: req.user.id,
      });
      
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const project = await projectService.updateProject(id, req.body, req.user.id);
      logger.info(`Project updated: ${id}`);
      
      res.status(200).json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      await projectService.deleteProject(id, req.user.id);
      logger.info(`Project deleted: ${id}`);
      
      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectMembers(req, res, next) {
    try {
      const { id } = req.params;
      const members = await projectService.getProjectMembers(id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  async addProjectMember(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;
      const member = await projectService.addProjectMember(id, userId, role, req.user.id);
      
      res.status(201).json({
        success: true,
        data: member,
        message: 'Member added successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
