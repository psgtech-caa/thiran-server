const TeamModel = require('../models/teamModel');
const EventModel = require('../models/eventModel');
const ParticipantModel = require('../models/participantModel');
const { generateResponse } = require('../utils/helpers');

const TeamController = {
  async getTeamsByEvent(req, res, next) {
    try {
      const { eventId } = req.params;

      const event = await EventModel.findById(eventId);
      if (!event) {
        return res.status(404).json(generateResponse(false, 'Event not found'));
      }

      const teams = await TeamModel.getTeamsByEvent(eventId);

      res.json(generateResponse(true, 'Teams fetched successfully', teams));
    } catch (error) {
      next(error);
    }
  },

  async getTeamDetails(req, res, next) {
    try {
      const { teamId } = req.params;

      const team = await TeamModel.findById(teamId);
      if (!team) {
        return res.status(404).json(generateResponse(false, 'Team not found'));
      }

      const members = await TeamModel.getTeamMembers(teamId);

      res.json(generateResponse(true, 'Team details fetched successfully', {
        ...team,
        members,
        member_count: members.length
      }));
    } catch (error) {
      next(error);
    }
  },

  async addTeamMember(req, res, next) {
    try {
      const { teamId } = req.params;
      const { member_email } = req.body;
      const participantId = req.participant.id;

      const team = await TeamModel.findById(teamId);
      if (!team) {
        return res.status(404).json(generateResponse(false, 'Team not found'));
      }

      const isLeader = await TeamModel.isLeader(teamId, participantId);
      if (!isLeader) {
        return res.status(403).json(generateResponse(false, 'Only team leader can add members'));
      }

      const event = await EventModel.findById(team.event_id);
      const currentCount = await TeamModel.getMemberCount(teamId);

      if (currentCount >= event.max_team_size) {
        return res.status(400).json(generateResponse(false, 'Team is full'));
      }

      const newMember = await ParticipantModel.findByEmail(member_email);
      if (!newMember) {
        return res.status(404).json(generateResponse(false, 'Member not found'));
      }

      const isMember = await TeamModel.isMember(teamId, newMember.id);
      if (isMember) {
        return res.status(409).json(generateResponse(false, 'Member already in team'));
      }

      const memberInAnotherTeam = await TeamModel.getParticipantTeamForEvent(newMember.id, team.event_id);
      if (memberInAnotherTeam) {
        return res.status(409).json(generateResponse(false, 'Member is already in another team for this event'));
      }

      await TeamModel.addMember(teamId, newMember.id);

      res.json(generateResponse(true, 'Member added successfully'));
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req, res, next) {
    try {
      const { teamId, participantId: memberIdToRemove } = req.params;
      const leaderId = req.participant.id;

      const team = await TeamModel.findById(teamId);
      if (!team) {
        return res.status(404).json(generateResponse(false, 'Team not found'));
      }

      const isLeader = await TeamModel.isLeader(teamId, leaderId);
      if (!isLeader) {
        return res.status(403).json(generateResponse(false, 'Only team leader can remove members'));
      }

      if (team.team_leader_id === memberIdToRemove) {
        return res.status(400).json(generateResponse(false, 'Cannot remove team leader'));
      }

      await TeamModel.removeMember(teamId, memberIdToRemove);

      res.json(generateResponse(true, 'Member removed successfully'));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = TeamController;
