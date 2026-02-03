const rateLimit = require('express-rate-limit');
const {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_REGISTER_MAX,
  RATE_LIMIT_OTP_MAX,
  RATE_LIMIT_LOGIN_MAX,
} = require('../config/constants');

const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_REGISTER_MAX,
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const otpLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_OTP_MAX,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip,
});

const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_LOGIN_MAX,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

module.exports = {
  generalLimiter,
  registerLimiter,
  otpLimiter,
  loginLimiter,
};
