const pool = require('../config/database');

const RegistrationModel = {
  async createIndividual(eventId, participantId) {
    const result = await pool.query(
      `INSERT INTO event_registrations (event_id, participant_id, registration_status)
       VALUES ($1, $2, 'registered')
       RETURNING *`,
      [eventId, participantId]
    );
    
    return result.rows[0];
  },

  async createTeamRegistration(eventId, participantId, teamId) {
    const result = await pool.query(
      `INSERT INTO event_registrations (event_id, participant_id, team_id, registration_status)
       VALUES ($1, $2, $3, 'registered')
       RETURNING *`,
      [eventId, participantId, teamId]
    );
    
    return result.rows[0];
  },

  async findById(registrationId) {
    const result = await pool.query(
      `SELECT er.*, e.name as event_name, e.event_type, e.event_date, e.venue,
       p.name as participant_name, p.email
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       JOIN participants p ON er.participant_id = p.id
       WHERE er.id = $1`,
      [registrationId]
    );
    
    return result.rows[0];
  },

  async findByEventAndParticipant(eventId, participantId) {
    const result = await pool.query(
      'SELECT * FROM event_registrations WHERE event_id = $1 AND participant_id = $2',
      [eventId, participantId]
    );
    
    return result.rows[0];
  },

  async cancel(registrationId) {
    const result = await pool.query(
      `UPDATE event_registrations 
       SET registration_status = 'cancelled' 
       WHERE id = $1 
       RETURNING *`,
      [registrationId]
    );
    
    return result.rows[0];
  },

  async getParticipantRegistrations(participantId) {
    const result = await pool.query(
      `SELECT er.*, e.id as event_id, e.name as event_name, e.description, 
       e.event_type, e.event_date, e.venue, e.event_category,
       t.id as team_id, t.team_name, t.team_leader_id
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       LEFT JOIN teams t ON er.team_id = t.id
       WHERE er.participant_id = $1 AND er.registration_status = 'registered'
       ORDER BY e.event_date ASC`,
      [participantId]
    );
    
    return result.rows;
  },

  async getEventRegistrations(eventId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT er.*, p.name, p.email, p.roll_number, p.department, p.year_of_study,
       t.team_name, t.team_leader_id
       FROM event_registrations er
       JOIN participants p ON er.participant_id = p.id
       LEFT JOIN teams t ON er.team_id = t.id
       WHERE er.event_id = $1 AND er.registration_status = 'registered'
       ORDER BY er.registered_at DESC
       LIMIT $2 OFFSET $3`,
      [eventId, limit, offset]
    );
    
    return result.rows;
  },

  async getTeamRegistrations(teamId) {
    const result = await pool.query(
      `SELECT er.*, p.name, p.email, p.roll_number
       FROM event_registrations er
       JOIN participants p ON er.participant_id = p.id
       WHERE er.team_id = $1 AND er.registration_status = 'registered'`,
      [teamId]
    );
    
    return result.rows;
  },

  async getRegistrationCount(eventId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM event_registrations 
       WHERE event_id = $1 AND registration_status = 'registered'`,
      [eventId]
    );
    
    return parseInt(result.rows[0].count);
  },

  async getParticipantRegistrationCount(participantId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM event_registrations 
       WHERE participant_id = $1 AND registration_status = 'registered'`,
      [participantId]
    );
    
    return parseInt(result.rows[0].count);
  },

  async isRegistered(eventId, participantId) {
    const result = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM event_registrations 
       WHERE event_id = $1 AND participant_id = $2 AND registration_status = 'registered')`,
      [eventId, participantId]
    );
    
    return result.rows[0].exists;
  },

  async getTotalRegistrations() {
    const result = await pool.query(
      'SELECT COUNT(*) FROM event_registrations WHERE registration_status = \'registered\''
    );
    
    return parseInt(result.rows[0].count);
  },
};

module.exports = RegistrationModel;
