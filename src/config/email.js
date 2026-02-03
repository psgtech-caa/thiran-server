const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

let transporter;

// Check if we're in development mode without real SMTP
const isDevelopmentMode = process.env.NODE_ENV !== 'production' && 
                          (process.env.EMAIL_HOST === 'localhost' || !process.env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD === 'dev');

if (isDevelopmentMode) {
  // Use a fake transporter for development (logs to console)
  console.log('⚠️  Email service running in DEVELOPMENT MODE');
  console.log('📧 OTPs will be logged to console instead of being sent');
  
  transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    ignoreTLS: true,
  });
} else {
  // Use real SMTP configuration
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verify the connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error);
      console.log('💡 Tip: Check your SMTP credentials in .env file');
    } else {
      console.log('✅ Email service ready');
    }
  });
}

module.exports = transporter;
