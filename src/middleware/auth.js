const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { JWT_SECRET } = require('../config/constants');
const { generateResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        generateResponse(false, 'No token provided. Please login.')
      );
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);

    const sessionResult = await pool.query(
      `SELECT s.*, p.id, p.name, p.email, p.roll_number, p.department, p.year_of_study, p.is_verified
       FROM sessions s
       JOIN participants p ON s.participant_id = p.id
       WHERE s.jwt_token = $1 AND s.is_active = true AND s.expires_at > NOW()`,
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json(
        generateResponse(false, 'Session expired or invalid. Please login again.')
      );
    }

    const session = sessionResult.rows[0];

    await pool.query(
      'UPDATE sessions SET last_activity_at = NOW() WHERE id = $1',
      [session.id]
    );

    req.participant = {
      id: session.participant_id,
      name: session.name,
      email: session.email,
      roll_number: session.roll_number,
      department: session.department,
      year_of_study: session.year_of_study,
      is_verified: session.is_verified,
    };
    req.sessionId = session.id;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        generateResponse(false, 'Invalid token. Please login again.')
      );
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        generateResponse(false, 'Token expired. Please login again.')
      );
    }

    logger.error('Authentication error:', error);
    return res.status(500).json(
      generateResponse(false, 'Authentication failed')
    );
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const sessionResult = await pool.query(
      `SELECT s.*, p.id, p.name, p.email, p.roll_number, p.department, p.year_of_study
       FROM sessions s
       JOIN participants p ON s.participant_id = p.id
       WHERE s.jwt_token = $1 AND s.is_active = true AND s.expires_at > NOW()`,
      [token]
    );

    if (sessionResult.rows.length > 0) {
      const session = sessionResult.rows[0];
      req.participant = {
        id: session.participant_id,
        name: session.name,
        email: session.email,
        roll_number: session.roll_number,
        department: session.department,
        year_of_study: session.year_of_study,
      };
    }

    next();
  } catch (error) {
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth,
};
