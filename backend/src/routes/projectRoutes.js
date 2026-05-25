const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Project name is required'),
    body('description').optional().trim(),
    body('repositoryUrl').optional().isURL().withMessage('Invalid repository URL'),
  ],
  projectController.createProject
);

router.get('/', projectController.getProjects);

router.get('/:id', projectController.getProjectById);

router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'inactive', 'archived']),
  ],
  projectController.updateProject
);

router.delete('/:id', projectController.deleteProject);

router.get('/:id/members', projectController.getProjectMembers);

router.post(
  '/:id/members',
  [
    body('userId').notEmpty().isUUID().withMessage('Valid user ID is required'),
    body('role').isIn(['admin', 'developer', 'viewer']).withMessage('Invalid role'),
  ],
  projectController.addProjectMember
);

module.exports = router;
