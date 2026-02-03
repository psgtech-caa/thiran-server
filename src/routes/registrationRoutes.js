const express = require('express');
const router = express.Router();
const RegistrationController = require('../controllers/registrationController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const validators = require('../utils/validators');

router.post('/individual/:eventId', authenticate, validators.eventId, validate, RegistrationController.registerIndividual);
router.post('/team/:eventId', authenticate, [...validators.eventId, ...validators.createTeam], validate, RegistrationController.registerTeam);
router.delete('/:registrationId', authenticate, validators.registrationId, validate, RegistrationController.cancelRegistration);

module.exports = router;
