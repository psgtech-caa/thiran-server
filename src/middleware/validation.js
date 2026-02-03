const { validationResult } = require('express-validator');
const { generateResponse } = require('../utils/helpers');

function validate(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return res.status(400).json(
      generateResponse(false, 'Validation failed', null, errorMessages)
    );
  }
  
  next();
}

module.exports = validate;
