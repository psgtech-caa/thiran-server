const pool = require('../config/database');

const TeamModel = {
  async create(eventId, teamName, teamLeaderId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const teamResult = await client.query(
        'INSERT INTO teams (event_id, team_name, team_leader_id) VALUES ($1, $2, $3) RETURNING *',
        [eventId, teamName, teamLeaderId]
      );

      const team = teamResult.rows[0];

      await client.query(
        'INSERT INTO team_members (team_id, participant_id) VALUES ($1, $2)',
        [team.id, teamLeaderId]
      );

      await client.query('COMMIT');
      return team;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findById(teamId) {
    const result = await pool.query(
      `SELECT t.*, e.name as event_name, e.event_type, e.max_team_size, e.min_team_size,
       p.name as leader_name, p.email as leader_email
       FROM teams t
       JOIN events e ON t.event_id = e.id
       JOIN participants p ON t.team_leader_id = p.id
       WHERE t.id = $1`,
      [teamId]
    );
    
    return result.rows[0];
  },

  async findByEventAndName(eventId, teamName) {
    const result = await pool.query(
      'SELECT * FROM teams WHERE event_id = $1 AND team_name = $2',
      [eventId, teamName]
    );
    
    return result.rows[0];
  },

  async getTeamMembers(teamId) {
    const result = await pool.query(
      `SELECT p.id, p.name, p.email, p.roll_number, p.department, p.year_of_study, tm.joined_at
       FROM team_members tm
       JOIN participants p ON tm.participant_id = p.id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );
    
    return result.rows;
  },

  async addMember(teamId, participantId) {
    const result = await pool.query(
      'INSERT INTO team_members (team_id, participant_id) VALUES ($1, $2) RETURNING *',
      [teamId, participantId]
    );
    
    return result.rows[0];
  },

  async removeMember(teamId, participantId) {
    await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND participant_id = $2',
      [teamId, participantId]
    );
  },

  async isMember(teamId, participantId) {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM team_members WHERE team_id = $1 AND participant_id = $2)',
      [teamId, participantId]
    );
    
    return result.rows[0].exists;
  },

  async getMemberCount(teamId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM team_members WHERE team_id = $1',
      [teamId]
    );
    
    return parseInt(result.rows[0].count);
  },

  async getTeamsByEvent(eventId) {
    const result = await pool.query(
      `SELECT t.*, p.name as leader_name, p.email as leader_email,
       COUNT(tm.id) as member_count
       FROM teams t
       JOIN participants p ON t.team_leader_id = p.id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.event_id = $1
       GROUP BY t.id, p.name, p.email
       ORDER BY t.created_at DESC`,
      [eventId]
    );
    
    return result.rows;
  },

  async isLeader(teamId, participantId) {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM teams WHERE id = $1 AND team_leader_id = $2)',
      [teamId, participantId]
    );
    
    return result.rows[0].exists;
  },

  async getParticipantTeamForEvent(participantId, eventId) {
    const result = await pool.query(
      `SELECT t.*
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.participant_id = $1 AND t.event_id = $2`,
      [participantId, eventId]
    );
    
    return result.rows[0];
  },
};

module.exports = TeamModel;
