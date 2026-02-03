const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { registerLimiter, otpLimiter, loginLimiter } = require('../middleware/rateLimiter');
const validators = require('../utils/validators');

router.post('/register', registerLimiter, validators.register, validate, AuthController.register);
router.post('/verify-otp', otpLimiter, validators.verifyOTP, validate, AuthController.verifyOTP);
router.post('/login', loginLimiter, validators.login, validate, AuthController.login);
router.post('/resend-otp', otpLimiter, validators.resendOTP, validate, AuthController.resendOTP);

router.get('/me', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validators.updateProfile, validate, AuthController.updateProfile);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
