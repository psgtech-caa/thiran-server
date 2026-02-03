const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/my-registrations', authenticate, DashboardController.getMyRegistrations);
router.get('/statistics', authenticate, DashboardController.getStatistics);

module.exports = router;
