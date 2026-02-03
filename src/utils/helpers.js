function generateResponse(success, message, data = null, error = null) {
  const response = {
    success,
    message,
  };

  if (data) {
    response.data = data;
  }

  if (error && process.env.NODE_ENV !== 'production') {
    response.error = error;
  }

  return response;
}

function paginateResults(results, page, limit, total) {
  return {
    data: results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

function sanitizeParticipant(participant) {
  const { password_hash, verification_token, ...sanitized } = participant;
  return sanitized;
}

function calculateSessionExpiry(days = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

function calculateOTPExpiry(minutes = 10) {
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + minutes);
  return expiryDate;
}

function isExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
}

module.exports = {
  generateResponse,
  paginateResults,
  sanitizeParticipant,
  calculateSessionExpiry,
  calculateOTPExpiry,
  isExpired,
};
