const logger = require('../utils/logger');
const { generateResponse } = require('../utils/helpers');

function errorHandler(err, req, res, next) {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    participant: req.participant?.id,
  });

  if (err.code === '23505') {
    const field = err.constraint?.includes('email') ? 'Email' : 'Roll number';
    return res.status(409).json(
      generateResponse(false, `${field} already exists`)
    );
  }

  if (err.code === '23503') {
    return res.status(404).json(
      generateResponse(false, 'Referenced resource not found')
    );
  }

  if (err.code === '23502') {
    return res.status(400).json(
      generateResponse(false, 'Required field missing')
    );
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json(
      generateResponse(false, 'Invalid or expired token')
    );
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An error occurred while processing your request'
    : err.message;

  res.status(statusCode).json(
    generateResponse(false, message, null, process.env.NODE_ENV !== 'production' ? err.stack : null)
  );
}

function notFound(req, res) {
  res.status(404).json(
    generateResponse(false, `Route ${req.originalUrl} not found`)
  );
}

module.exports = {
  errorHandler,
  notFound,
};
