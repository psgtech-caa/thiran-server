const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const { optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validation');
const validators = require('../utils/validators');

router.get('/', optionalAuth, validators.listEvents, validate, EventController.getAllEvents);
router.get('/:eventId', optionalAuth, validators.eventId, validate, EventController.getEventById);

module.exports = router;
