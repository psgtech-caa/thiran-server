module.exports = {
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // OTP
  OTP_EXPIRE_MINUTES: parseInt(process.env.OTP_EXPIRE_MINUTES) || 10,
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH) || 6,
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
  
  // Session
  SESSION_EXPIRE_DAYS: parseInt(process.env.SESSION_EXPIRE_DAYS) || 7,
  
  // Email
  ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN || 'psgtech.ac.in',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  RATE_LIMIT_REGISTER_MAX: parseInt(process.env.RATE_LIMIT_REGISTER_MAX) || 3,
  RATE_LIMIT_OTP_MAX: parseInt(process.env.RATE_LIMIT_OTP_MAX) || 5,
  RATE_LIMIT_LOGIN_MAX: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  
  // Departments (Department codes from roll number)
  DEPARTMENT_CODES: {
    'MX': 'MCA',
    'CS': 'CSE',
    'IT': 'IT',
    'EC': 'ECE',
    'EE': 'EEE',
    'ME': 'MECH',
    'CE': 'CIVIL',
    'AD': 'AI&DS',
    'CB': 'CSBS',
    'BM': 'BME',
    'AM': 'Automobile Engineering'
  },
  
  // Year of Study
  YEARS_OF_STUDY: [1, 2, 3, 4],
  
  // Current academic year for year calculation
  CURRENT_YEAR: 2026,
  
  // Event Types
  EVENT_TYPES: ['individual', 'team'],
  
  // Registration Status
  REGISTRATION_STATUS: ['registered', 'cancelled', 'attended'],
};
