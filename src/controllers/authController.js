const jwt = require('jsonwebtoken');
const ParticipantModel = require('../models/participantModel');
const AuthModel = require('../models/authModel');
const { generateOTP } = require('../utils/otpGenerator');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');
const { generateResponse, calculateSessionExpiry, calculateOTPExpiry } = require('../utils/helpers');
const { parseRollNumber, validateRollNumber } = require('../utils/rollNumberHelper');
const { JWT_SECRET, JWT_EXPIRE, OTP_EXPIRE_MINUTES, OTP_MAX_ATTEMPTS, SESSION_EXPIRE_DAYS } = require('../config/constants');
const logger = require('../utils/logger');
const pool = require('../config/database');

const AuthController = {
  async register(req, res, next) {
    try {
      const { name, roll_number, phone_number } = req.body;

      // Parse and validate roll number
      const rollInfo = validateRollNumber(roll_number);
      if (!rollInfo.valid) {
        return res.status(400).json(
          generateResponse(false, rollInfo.error)
        );
      }

      // Check if user already exists
      const existingUser = await ParticipantModel.findByRollNumber(rollInfo.rollNumber);
      if (existingUser) {
        return res.status(409).json(
          generateResponse(false, 'Roll number already registered. Please login instead.')
        );
      }

      // Create participant with auto-generated email, department, and year
      const participant = await ParticipantModel.create({
        name,
        roll_number: rollInfo.rollNumber,
        email: rollInfo.email,
        department: rollInfo.department,
        year_of_study: rollInfo.yearOfStudy,
        phone_number
      });

      // Generate OTP
      const otp = generateOTP(6);
      const expiresAt = calculateOTPExpiry(OTP_EXPIRE_MINUTES);

      await AuthModel.createToken(participant.id, otp, 'otp', 'registration', expiresAt);

      // Send OTP email
      await sendOTPEmail(rollInfo.email, otp, name, 'verification');

      // Log activity
      await pool.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [participant.id, 'registration_initiated', { 
          roll_number: rollInfo.rollNumber, 
          email: rollInfo.email,
          department: rollInfo.department,
          year: rollInfo.yearOfStudy 
        }, req.ip]
      );

      logger.info(`Registration initiated for roll number: ${rollInfo.rollNumber}`);

      res.status(201).json(
        generateResponse(true, 'Registration successful! OTP sent to your email.', {
          participant_id: participant.id,
          roll_number: rollInfo.rollNumber,
          email: rollInfo.email,
          department: rollInfo.department,
          year_of_study: rollInfo.yearOfStudy,
          expires_in_minutes: OTP_EXPIRE_MINUTES,
          message: 'Check your email or console for OTP'
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async verifyOTP(req, res, next) {
    try {
      const { roll_number, otp } = req.body;

      // Parse roll number
      const rollInfo = validateRollNumber(roll_number);
      if (!rollInfo.valid) {
        return res.status(400).json(
          generateResponse(false, rollInfo.error)
        );
      }

      // Find token
      const tokenData = await AuthModel.findToken(rollInfo.email, otp, 'registration');
      
      // Also check for login tokens
      if (!tokenData && await AuthModel.findToken(rollInfo.email, otp, 'login')) {
        const loginTokenData = await AuthModel.findToken(rollInfo.email, otp, 'login');
        if (loginTokenData) {
          return AuthController.completeLogin(req, res, next, loginTokenData, rollInfo.email);
        }
      }

      if (!tokenData) {
        return res.status(400).json(
          generateResponse(false, 'Invalid or expired OTP. Please request a new one.')
        );
      }

      if (tokenData.attempts >= OTP_MAX_ATTEMPTS) {
        await AuthModel.markTokenAsUsed(tokenData.id);
        return res.status(400).json(
          generateResponse(false, 'Maximum OTP attempts exceeded. Please request a new OTP.')
        );
      }

      // Mark token as used and verify participant
      await AuthModel.markTokenAsUsed(tokenData.id);
      await ParticipantModel.markAsVerified(tokenData.participant_id);
      await AuthModel.invalidateTokens(tokenData.participant_id, 'registration');

      const participant = await ParticipantModel.findById(tokenData.participant_id);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: participant.id, 
          roll_number: participant.roll_number,
          email: participant.email 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
      );

      const sessionExpiry = calculateSessionExpiry(SESSION_EXPIRE_DAYS);
      await AuthModel.createSession(
        participant.id,
        token,
        req.ip,
        req.get('user-agent'),
        sessionExpiry
      );

      await ParticipantModel.updateLastLogin(participant.id);

      await pool.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [participant.id, 'registration_completed', { roll_number: participant.roll_number }, req.ip]
      );

      // Send welcome email (async, non-blocking)
      sendWelcomeEmail(participant.email, participant.name).catch(err => 
        logger.error('Failed to send welcome email:', err)
      );

      logger.info(`Registration completed for roll number: ${participant.roll_number}`);

      res.json(
        generateResponse(true, 'Email verified successfully! Welcome to Thiran 2026.', {
          token,
          participant: {
            id: participant.id,
            name: participant.name,
            roll_number: participant.roll_number,
            email: participant.email,
            department: participant.department,
            year_of_study: participant.year_of_study,
            phone_number: participant.phone_number
          },
          expires_at: sessionExpiry
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { roll_number } = req.body;

      // Parse roll number
      const rollInfo = validateRollNumber(roll_number);
      if (!rollInfo.valid) {
        return res.status(400).json(
          generateResponse(false, rollInfo.error)
        );
      }

      // Find participant by roll number
      const participant = await ParticipantModel.findByRollNumber(rollInfo.rollNumber);
      
      if (!participant) {
        return res.status(404).json(
          generateResponse(false, 'No account found with this roll number. Please register first.')
        );
      }

      if (!participant.is_verified) {
        return res.status(403).json(
          generateResponse(false, 'Account not verified. Please complete registration by verifying your OTP.')
        );
      }

      // Generate OTP
      const otp = generateOTP(6);
      const expiresAt = calculateOTPExpiry(OTP_EXPIRE_MINUTES);

      await AuthModel.invalidateTokens(participant.id, 'login');
      await AuthModel.createToken(participant.id, otp, 'otp', 'login', expiresAt);

      await sendOTPEmail(participant.email, otp, participant.name, 'login');

      await pool.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [participant.id, 'login_otp_requested', { roll_number: rollInfo.rollNumber }, req.ip]
      );

      logger.info(`Login OTP sent for roll number: ${rollInfo.rollNumber}`);

      res.json(
        generateResponse(true, 'Login OTP sent to your email. Please verify to continue.', {
          roll_number: rollInfo.rollNumber,
          email: participant.email,
          expires_in_minutes: OTP_EXPIRE_MINUTES,
          message: 'Check your email or console for OTP'
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async completeLogin(req, res, next, tokenData, email) {
    try {
      await AuthModel.markTokenAsUsed(tokenData.id);
      await AuthModel.invalidateTokens(tokenData.participant_id, 'login');

      const participant = await ParticipantModel.findById(tokenData.participant_id);

      const token = jwt.sign(
        { 
          id: participant.id, 
          roll_number: participant.roll_number,
          email: participant.email 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
      );

      const sessionExpiry = calculateSessionExpiry(SESSION_EXPIRE_DAYS);
      await AuthModel.createSession(
        participant.id,
        token,
        req.ip,
        req.get('user-agent'),
        sessionExpiry
      );

      await ParticipantModel.updateLastLogin(participant.id);

      await pool.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [participant.id, 'login_completed', { roll_number: participant.roll_number }, req.ip]
      );

      logger.info(`Login successful for roll number: ${participant.roll_number}`);

      res.json(
        generateResponse(true, 'Login successful! Welcome back.', {
          token,
          participant: {
            id: participant.id,
            name: participant.name,
            roll_number: participant.roll_number,
            email: participant.email,
            department: participant.department,
            year_of_study: participant.year_of_study,
            phone_number: participant.phone_number
          },
          expires_at: sessionExpiry
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async resendOTP(req, res, next) {
    try {
      const { roll_number } = req.body;

      // Parse roll number
      const rollInfo = validateRollNumber(roll_number);
      if (!rollInfo.valid) {
        return res.status(400).json(
          generateResponse(false, rollInfo.error)
        );
      }

      const participant = await ParticipantModel.findByRollNumber(rollInfo.rollNumber);
      
      if (!participant) {
        return res.status(404).json(
          generateResponse(false, 'No account found with this roll number')
        );
      }

      const purpose = participant.is_verified ? 'login' : 'registration';

      const otp = generateOTP(6);
      const expiresAt = calculateOTPExpiry(OTP_EXPIRE_MINUTES);

      await AuthModel.invalidateTokens(participant.id, purpose);
      await AuthModel.createToken(participant.id, otp, 'otp', purpose, expiresAt);

      await sendOTPEmail(participant.email, otp, participant.name, purpose);

      logger.info(`OTP resent for roll number: ${rollInfo.rollNumber}`);

      res.json(
        generateResponse(true, 'New OTP sent to your email', {
          roll_number: rollInfo.rollNumber,
          email: participant.email,
          expires_in_minutes: OTP_EXPIRE_MINUTES
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const participant = await ParticipantModel.findById(req.participant.id);

      if (!participant) {
        return res.status(404).json(
          generateResponse(false, 'Participant not found')
        );
      }

      res.json(
        generateResponse(true, 'Profile fetched successfully', {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          roll_number: participant.roll_number,
          department: participant.department,
          year_of_study: participant.year_of_study,
          phone_number: participant.phone_number,
          is_verified: participant.is_verified,
          created_at: participant.created_at,
          last_login_at: participant.last_login_at
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { name, phone_number } = req.body;
      const updates = {};

      if (name) updates.name = name;
      if (phone_number) updates.phone_number = phone_number;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json(
          generateResponse(false, 'No fields to update')
        );
      }

      const updatedParticipant = await ParticipantModel.update(req.participant.id, updates);

      await pool.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [req.participant.id, 'profile_updated', updates, req.ip]
      );

      res.json(
        generateResponse(true, 'Profile updated successfully', {
          id: updatedParticipant.id,
          name: updatedParticipant.name,
          email: updatedParticipant.email,
          phone_number: updatedParticipant.phone_number
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      await AuthModel.invalidateSession(req.sessionId);

      await pool.query(
        'INSERT INTO activity_logs (participant_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [req.participant.id, 'logout', {}, req.ip]
      );

      logger.info(`Logout successful for ${req.participant.email}`);

      res.json(
        generateResponse(true, 'Logged out successfully')
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AuthController;
