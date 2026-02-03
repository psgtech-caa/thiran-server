const pool = require('../config/database');

const EventModel = {
  async create(eventData) {
    const {
      name, description, event_type, max_team_size, min_team_size,
      registration_deadline, event_date, venue, max_participants,
      rules, prize_details, contact_person, contact_email, event_category
    } = eventData;
    
    const result = await pool.query(
      `INSERT INTO events (name, description, event_type, max_team_size, min_team_size,
       registration_deadline, event_date, venue, max_participants, rules, prize_details,
       contact_person, contact_email, event_category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, description, event_type, max_team_size, min_team_size, registration_deadline,
       event_date, venue, max_participants, rules, prize_details, contact_person,
       contact_email, event_category]
    );
    
    return result.rows[0];
  },

  async findAll(filters = {}, limit = 20, offset = 0) {
    let query = 'SELECT * FROM events WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      query += ` AND event_category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.type) {
      query += ` AND event_type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    query += ` ORDER BY event_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    });

    values.push(id);

    const result = await pool.query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(id) {
    await pool.query('UPDATE events SET is_active = false WHERE id = $1', [id]);
  },

  async getCount(filters = {}) {
    let query = 'SELECT COUNT(*) FROM events WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      query += ` AND event_category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.type) {
      query += ` AND event_type = $${paramCount}`;
      params.push(filters.type);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  async getRegistrationCount(eventId) {
    const result = await pool.query(
      'SELECT current_registrations FROM events WHERE id = $1',
      [eventId]
    );
    
    return result.rows[0]?.current_registrations || 0;
  },

  async isRegistrationOpen(eventId) {
    const result = await pool.query(
      `SELECT is_active, registration_deadline, max_participants, current_registrations
       FROM events WHERE id = $1`,
      [eventId]
    );
    
    const event = result.rows[0];
    if (!event) return false;
    
    return event.is_active && 
           new Date(event.registration_deadline) > new Date() &&
           (!event.max_participants || event.current_registrations < event.max_participants);
  },
};

module.exports = EventModel;
