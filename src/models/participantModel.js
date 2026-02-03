const pool = require('../config/database');

const ParticipantModel = {
  async create(participantData) {
    const { name, roll_number, email, department, year_of_study, phone_number } = participantData;
    
    const result = await pool.query(
      `INSERT INTO participants (name, roll_number, email, department, year_of_study, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, roll_number, email, department, year_of_study, phone_number]
    );
    
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM participants WHERE email = $1',
      [email]
    );
    
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM participants WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  },

  async findByRollNumber(rollNumber) {
    const result = await pool.query(
      'SELECT * FROM participants WHERE roll_number = $1',
      [rollNumber]
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
      `UPDATE participants SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async markAsVerified(id) {
    const result = await pool.query(
      'UPDATE participants SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    return result.rows[0];
  },

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE participants SET last_login_at = NOW() WHERE id = $1',
      [id]
    );
  },

  async findByEmails(emails) {
    const result = await pool.query(
      'SELECT * FROM participants WHERE email = ANY($1::text[])',
      [emails]
    );
    
    return result.rows;
  },

  async getAll(limit = 50, offset = 0) {
    const result = await pool.query(
      'SELECT * FROM participants ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return result.rows;
  },

  async getCount() {
    const result = await pool.query('SELECT COUNT(*) FROM participants');
    return parseInt(result.rows[0].count);
  },
};

module.exports = ParticipantModel;
