const { body, param, query } = require('express-validator');
const { ALLOWED_EMAIL_DOMAIN, DEPARTMENTS, YEARS_OF_STUDY } = require('../config/constants');

const validators = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('roll_number')
      .trim()
      .notEmpty().withMessage('Roll number is required')
      .matches(/^[0-9]{2}[A-Z]{2}[0-9]{3}$/i).withMessage('Invalid roll number format. Expected: 25MX114 (2 digits + 2 letters + 3 digits)'),
    
    body('phone_number')
      .optional()
      .trim()
      .matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number format'),
  ],

  verifyOTP: [
    body('roll_number')
      .trim()
      .notEmpty().withMessage('Roll number is required')
      .matches(/^[0-9]{2}[A-Z]{2}[0-9]{3}$/i).withMessage('Invalid roll number format'),
    
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
      .isNumeric().withMessage('OTP must contain only numbers'),
  ],

  login: [
    body('roll_number')
      .trim()
      .notEmpty().withMessage('Roll number is required')
      .matches(/^[0-9]{2}[A-Z]{2}[0-9]{3}$/i).withMessage('Invalid roll number format. Expected: 25MX114'),
  ],

  resendOTP: [
    body('roll_number')
      .trim()
      .notEmpty().withMessage('Roll number is required')
      .matches(/^[0-9]{2}[A-Z]{2}[0-9]{3}$/i).withMessage('Invalid roll number format'),
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('phone_number')
      .optional()
      .trim()
      .matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number format'),
  ],

  createTeam: [
    param('eventId')
      .isUUID().withMessage('Invalid event ID'),
    
    body('team_name')
      .trim()
      .notEmpty().withMessage('Team name is required')
      .isLength({ min: 3, max: 50 }).withMessage('Team name must be between 3 and 50 characters'),
    
    body('member_emails')
      .isArray({ min: 1 }).withMessage('At least one team member email is required')
      .custom((emails) => {
        if (emails.length > 10) {
          throw new Error('Maximum 10 team members allowed');
        }
        return true;
      }),
    
    body('member_emails.*')
      .trim()
      .isEmail().withMessage('Invalid email format')
      .custom((value) => {
        if (!value.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
          throw new Error(`Only @${ALLOWED_EMAIL_DOMAIN} emails are allowed`);
        }
        return true;
      }),
  ],

  addTeamMember: [
    param('teamId')
      .isUUID().withMessage('Invalid team ID'),
    
    body('member_email')
      .trim()
      .notEmpty().withMessage('Member email is required')
      .isEmail().withMessage('Invalid email format')
      .custom((value) => {
        if (!value.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
          throw new Error(`Only @${ALLOWED_EMAIL_DOMAIN} emails are allowed`);
        }
        return true;
      }),
  ],

  eventId: [
    param('eventId')
      .isUUID().withMessage('Invalid event ID'),
  ],

  teamId: [
    param('teamId')
      .isUUID().withMessage('Invalid team ID'),
  ],

  registrationId: [
    param('registrationId')
      .isUUID().withMessage('Invalid registration ID'),
  ],

  listEvents: [
    query('category')
      .optional()
      .trim(),
    
    query('type')
      .optional()
      .isIn(['individual', 'team']).withMessage('Type must be either individual or team'),
    
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
};

module.exports = validators;
