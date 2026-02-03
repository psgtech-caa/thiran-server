const EventModel = require('../models/eventModel');
const TeamModel = require('../models/teamModel');
const RegistrationModel = require('../models/registrationModel');
const ParticipantModel = require('../models/participantModel');
const { generateResponse } = require('../utils/helpers');
const { sendEventRegistrationEmail } = require('../utils/emailService');
const logger = require('../utils/logger');
const pool = require('../config/database');

const RegistrationController = {
  async registerIndividual(req, res, next) {
    try {
      const { eventId } = req.params;
      const participantId = req.participant.id;

      const event = await EventModel.findById(eventId);
      if (!event) {
        return res.status(404).json(generateResponse(false, 'Event not found'));
      }

      if (event.event_type !== 'individual') {
        return res.status(400).json(generateResponse(false, 'This is a team event. Please register with a team.'));
      }

      const isOpen = await EventModel.isRegistrationOpen(eventId);
      if (!isOpen) {
        return res.status(400).json(generateResponse(false, 'Registration is closed for this event'));
      }

      const alreadyRegistered = await RegistrationModel.isRegistered(eventId, participantId);
      if (alreadyRegistered) {
        return res.status(409).json(generateResponse(false, 'Already registered for this event'));
      }

      const registration = await RegistrationModel.createIndividual(eventId, participantId);

      await pool.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [participantId, 'event_registration', { event_id: eventId, event_name: event.name }, req.ip]
      );

      sendEventRegistrationEmail(
        req.participant.email,
        req.participant.name,
        event.name,
        event.event_date,
        event.venue,
        false,
        null
      ).catch(err => logger.error('Failed to send registration email:', err));

      logger.info(`Individual registration: ${req.participant.email} for ${event.name}`);

      res.status(201).json(
        generateResponse(true, 'Successfully registered for event', {
          registration_id: registration.id,
          event_name: event.name,
          event_date: event.event_date,
          venue: event.venue,
          registered_at: registration.registered_at
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async registerTeam(req, res, next) {
    const client = await pool.connect();
    try {
      const { eventId } = req.params;
      const { team_name, member_emails } = req.body;
      const participantId = req.participant.id;

      await client.query('BEGIN');

      const event = await EventModel.findById(eventId);
      if (!event) {
        await client.query('ROLLBACK');
        return res.status(404).json(generateResponse(false, 'Event not found'));
      }

      if (event.event_type !== 'team') {
        await client.query('ROLLBACK');
        return res.status(400).json(generateResponse(false, 'This is an individual event'));
      }

      const isOpen = await EventModel.isRegistrationOpen(eventId);
      if (!isOpen) {
        await client.query('ROLLBACK');
        return res.status(400).json(generateResponse(false, 'Registration is closed'));
      }

      const existingTeam = await TeamModel.findByEventAndName(eventId, team_name);
      if (existingTeam) {
        await client.query('ROLLBACK');
        return res.status(409).json(generateResponse(false, 'Team name already exists for this event'));
      }

      const totalMembers = member_emails.length + 1;
      if (totalMembers < event.min_team_size || totalMembers > event.max_team_size) {
        await client.query('ROLLBACK');
        return res.status(400).json(
          generateResponse(false, `Team size must be between ${event.min_team_size} and ${event.max_team_size} members`)
        );
      }

      const alreadyInTeam = await TeamModel.getParticipantTeamForEvent(participantId, eventId);
      if (alreadyInTeam) {
        await client.query('ROLLBACK');
        return res.status(409).json(generateResponse(false, 'You are already part of a team for this event'));
      }

      const members = await ParticipantModel.findByEmails(member_emails);
      if (members.length !== member_emails.length) {
        await client.query('ROLLBACK');
        return res.status(400).json(generateResponse(false, 'Some team members are not registered'));
      }

      for (const member of members) {
        const memberInTeam = await TeamModel.getParticipantTeamForEvent(member.id, eventId);
        if (memberInTeam) {
          await client.query('ROLLBACK');
          return res.status(409).json(
            generateResponse(false, `${member.name} is already part of another team for this event`)
          );
        }
      }

      const team = await TeamModel.create(eventId, team_name, participantId);

      for (const member of members) {
        await TeamModel.addMember(team.id, member.id);
      }

      const allMembers = [participantId, ...members.map(m => m.id)];
      for (const memberId of allMembers) {
        await RegistrationModel.createTeamRegistration(eventId, memberId, team.id);
      }

      await client.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [participantId, 'team_registration', { event_id: eventId, team_id: team.id, team_name }, req.ip]
      );

      await client.query('COMMIT');

      const teamMembers = await TeamModel.getTeamMembers(team.id);

      for (const member of teamMembers) {
        sendEventRegistrationEmail(
          member.email,
          member.name,
          event.name,
          event.event_date,
          event.venue,
          true,
          team_name
        ).catch(err => logger.error('Failed to send registration email:', err));
      }

      logger.info(`Team registration: ${team_name} for ${event.name}`);

      res.status(201).json(
        generateResponse(true, 'Team created and registered successfully', {
          team_id: team.id,
          team_name: team.team_name,
          event_name: event.name,
          event_date: event.event_date,
          venue: event.venue,
          members: teamMembers.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.id === participantId ? 'leader' : 'member'
          }))
        })
      );
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },

  async cancelRegistration(req, res, next) {
    try {
      const { registrationId } = req.params;
      const participantId = req.participant.id;

      const registration = await RegistrationModel.findById(registrationId);

      if (!registration) {
        return res.status(404).json(generateResponse(false, 'Registration not found'));
      }

      if (registration.participant_id !== participantId) {
        return res.status(403).json(generateResponse(false, 'Not authorized to cancel this registration'));
      }

      if (registration.registration_status === 'cancelled') {
        return res.status(400).json(generateResponse(false, 'Registration already cancelled'));
      }

      await RegistrationModel.cancel(registrationId);

      await pool.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [participantId, 'registration_cancelled', { registration_id: registrationId }, req.ip]
      );

      res.json(generateResponse(true, 'Registration cancelled successfully'));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = RegistrationController;
