const express = require('express');
const logsController = require('../controllers/logsController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/', logsController.getLogs);

router.get('/stream', logsController.streamLogs);

router.get('/stats', logsController.getLogStats);

router.get('/export', logsController.exportLogs);

module.exports = router;
