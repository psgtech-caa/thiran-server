const RegistrationModel = require('../models/registrationModel');
const TeamModel = require('../models/teamModel');
const { generateResponse } = require('../utils/helpers');

const DashboardController = {
  async getMyRegistrations(req, res, next) {
    try {
      const participantId = req.participant.id;

      const registrations = await RegistrationModel.getParticipantRegistrations(participantId);

      const individualEvents = [];
      const teamEvents = [];

      for (const reg of registrations) {
        if (reg.event_type === 'individual') {
          individualEvents.push({
            registration_id: reg.id,
            event: {
              id: reg.event_id,
              name: reg.event_name,
              description: reg.description,
              event_date: reg.event_date,
              venue: reg.venue,
              event_category: reg.event_category
            },
            registered_at: reg.registered_at,
            status: reg.registration_status
          });
        } else if (reg.event_type === 'team' && reg.team_id) {
          const teamMembers = await TeamModel.getTeamMembers(reg.team_id);
          
          teamEvents.push({
            registration_id: reg.id,
            event: {
              id: reg.event_id,
              name: reg.event_name,
              description: reg.description,
              event_date: reg.event_date,
              venue: reg.venue,
              event_category: reg.event_category
            },
            team: {
              id: reg.team_id,
              team_name: reg.team_name,
              is_leader: reg.team_leader_id === participantId,
              members: teamMembers.map(m => ({
                id: m.id,
                name: m.name,
                email: m.email,
                roll_number: m.roll_number,
                department: m.department,
                year_of_study: m.year_of_study
              }))
            },
            registered_at: reg.registered_at,
            status: reg.registration_status
          });
        }
      }

      res.json(
        generateResponse(true, 'Registrations fetched successfully', {
          individual_events: individualEvents,
          team_events: teamEvents,
          total_registrations: registrations.length
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async getStatistics(req, res, next) {
    try {
      const participantId = req.participant.id;

      const totalRegistrations = await RegistrationModel.getParticipantRegistrationCount(participantId);

      res.json(
        generateResponse(true, 'Statistics fetched successfully', {
          total_registrations: totalRegistrations
        })
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = DashboardController;
