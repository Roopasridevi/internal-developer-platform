const express = require('express');
const { body } = require('express-validator');
const deploymentController = require('../controllers/deploymentController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('projectId').notEmpty().isUUID().withMessage('Valid project ID is required'),
    body('environment').notEmpty().trim().withMessage('Environment is required'),
    body('version').notEmpty().trim().withMessage('Version is required'),
    body('imageUrl').optional().isURL().withMessage('Invalid image URL'),
  ],
  deploymentController.createDeployment
);

router.get('/', deploymentController.getDeployments);

router.get('/:id', deploymentController.getDeploymentById);

router.post('/:id/rollback', deploymentController.rollbackDeployment);

router.get('/:id/status', deploymentController.getDeploymentStatus);

router.get('/projects/:projectId/environments', deploymentController.getEnvironments);

module.exports = router;
