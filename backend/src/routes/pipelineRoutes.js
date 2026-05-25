const express = require('express');
const { body } = require('express-validator');
const pipelineController = require('../controllers/pipelineController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Pipeline name is required'),
    body('projectId').notEmpty().isUUID().withMessage('Valid project ID is required'),
    body('config').isObject().withMessage('Pipeline config must be an object'),
  ],
  pipelineController.createPipeline
);

router.get('/', pipelineController.getPipelines);

router.get('/:id', pipelineController.getPipelineById);

router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('config').optional().isObject(),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  pipelineController.updatePipeline
);

router.delete('/:id', pipelineController.deletePipeline);

router.post('/:id/execute', pipelineController.executePipeline);

router.get('/:id/executions', pipelineController.getPipelineExecutions);

module.exports = router;
