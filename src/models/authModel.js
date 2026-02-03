const pool = require('../config/database');

const AuthModel = {
  async createToken(participantId, token, tokenType, purpose, expiresAt) {
    const result = await pool.query(
      `INSERT INTO auth_tokens (participant_id, token, token_type, purpose, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [participantId, token, tokenType, purpose, expiresAt]
    );
    
    return result.rows[0];
  },

  async findToken(email, token, purpose) {
    const result = await pool.query(
      `SELECT at.*, p.id as participant_id, p.email, p.name, p.is_verified
       FROM auth_tokens at
       JOIN participants p ON at.participant_id = p.id
       WHERE p.email = $1 AND at.token = $2 AND at.purpose = $3 
       AND at.is_used = false AND at.expires_at > NOW()
       ORDER BY at.created_at DESC
       LIMIT 1`,
      [email, token, purpose]
    );
    
    return result.rows[0];
  },

  async markTokenAsUsed(tokenId) {
    await pool.query(
      'UPDATE auth_tokens SET is_used = true WHERE id = $1',
      [tokenId]
    );
  },

  async incrementAttempts(tokenId) {
    const result = await pool.query(
      'UPDATE auth_tokens SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts',
      [tokenId]
    );
    
    return result.rows[0]?.attempts || 0;
  },

  async invalidateTokens(participantId, purpose) {
    await pool.query(
      'UPDATE auth_tokens SET is_used = true WHERE participant_id = $1 AND purpose = $2 AND is_used = false',
      [participantId, purpose]
    );
  },

  async createSession(participantId, jwtToken, ipAddress, userAgent, expiresAt) {
    const result = await pool.query(
      `INSERT INTO sessions (participant_id, jwt_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [participantId, jwtToken, ipAddress, userAgent, expiresAt]
    );
    
    return result.rows[0];
  },

  async findSession(jwtToken) {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE jwt_token = $1 AND is_active = true AND expires_at > NOW()',
      [jwtToken]
    );
    
    return result.rows[0];
  },

  async invalidateSession(sessionId) {
    await pool.query(
      'UPDATE sessions SET is_active = false WHERE id = $1',
      [sessionId]
    );
  },

  async invalidateAllSessions(participantId) {
    await pool.query(
      'UPDATE sessions SET is_active = false WHERE participant_id = $1 AND is_active = true',
      [participantId]
    );
  },

  async getActiveSessions(participantId) {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE participant_id = $1 AND is_active = true AND expires_at > NOW() ORDER BY created_at DESC',
      [participantId]
    );
    
    return result.rows;
  },

  async cleanupExpiredRecords() {
    await pool.query('SELECT cleanup_expired_records()');
  },
};

module.exports = AuthModel;
