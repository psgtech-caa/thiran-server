const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const validators = require('../utils/validators');

router.get('/event/:eventId', authenticate, validators.eventId, validate, TeamController.getTeamsByEvent);
router.get('/:teamId', authenticate, validators.teamId, validate, TeamController.getTeamDetails);
router.put('/:teamId/add-member', authenticate, validators.addTeamMember, validate, TeamController.addTeamMember);
router.delete('/:teamId/remove-member/:participantId', authenticate, validators.teamId, validate, TeamController.removeMember);

module.exports = router;
