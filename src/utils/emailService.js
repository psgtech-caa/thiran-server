const transporter = require('../config/email');
const logger = require('./logger');

// Check if running in development mode
const isDevelopmentMode = process.env.NODE_ENV !== 'production' && 
                          (process.env.EMAIL_HOST === 'localhost' || !process.env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD === 'dev');

async function sendOTPEmail(email, otp, name, purpose = 'verification') {
  try {
    // In development mode, just log the OTP to console
    if (isDevelopmentMode) {
      console.log('\n' + '='.repeat(60));
      console.log('📧 EMAIL (Development Mode - Not Actually Sent)');
      console.log('='.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Purpose: ${purpose}`);
      console.log(`\n🔑 OTP: ${otp}`);
      console.log(`⏰ Valid for: 10 minutes`);
      console.log('='.repeat(60) + '\n');
      
      logger.info(`OTP for ${email}: ${otp} (Development mode - logged to console)`);
      return true;
    }

    const subject = purpose === 'login' 
      ? 'Thiran 2026 - Login OTP' 
      : 'Thiran 2026 - Email Verification OTP';
    
    const message = purpose === 'login'
      ? `Your login OTP for Thiran 2026 is: <strong>${otp}</strong>`
      : `Welcome to Thiran 2026! Your verification OTP is: <strong>${otp}</strong>`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Thiran 2026</h1>
              <p>PSG College of Technology</p>
            </div>
            <div class="content">
              <h2>Hello ${name || 'Participant'}!</h2>
              <p>${message}</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                <div class="otp">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⏱️ Important:</strong> This OTP is valid for 10 minutes only.
              </div>
              
              <p><strong>Security Tips:</strong></p>
              <ul>
                <li>Never share this OTP with anyone</li>
                <li>Thiran team will never ask for your OTP</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
              
              <p>For any queries, contact us at <a href="mailto:thiran@psgtech.ac.in">thiran@psgtech.ac.in</a></p>
              
              <div class="footer">
                <p>Department of Computer Applications</p>
                <p>PSG College of Technology, Coimbatore</p>
                <p>© 2026 Thiran. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send OTP email to ${email}:`, error);
    throw new Error('Failed to send verification email');
  }
}

async function sendWelcomeEmail(email, name) {
  try {
    if (isDevelopmentMode) {
      console.log(`\n📧 Welcome email would be sent to: ${email} (Development mode)\n`);
      logger.info(`Welcome email for ${email} (Development mode - not sent)`);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Thiran 2026! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Thiran 2026!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Congratulations! Your registration for Thiran 2026 is complete.</p>
              <p>You can now explore and register for exciting events across various categories:</p>
              <ul>
                <li>💻 Technical Events</li>
                <li>🎨 Cultural Events</li>
                <li>🎮 Gaming Competitions</li>
                <li>🏆 Workshops & Seminars</li>
              </ul>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
              </p>
              <p>Stay tuned for updates and don't miss out on any exciting opportunities!</p>
              <div class="footer">
                <p>Department of Computer Applications</p>
                <p>PSG College of Technology, Coimbatore</p>
                <p>© 2026 Thiran. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}:`, error);
  }
}

async function sendEventRegistrationEmail(email, name, eventName, eventDate, venue, isTeamEvent, teamName) {
  try {
    if (isDevelopmentMode) {
      console.log(`\n📧 Registration confirmation would be sent to: ${email} for ${eventName} (Development mode)\n`);
      logger.info(`Registration email for ${email} - ${eventName} (Development mode - not sent)`);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Thiran 2026 - Registration Confirmed for ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Registration Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Your registration for <strong>${eventName}</strong> has been confirmed.</p>
              
              <div class="event-details">
                <h3>📋 Event Details</h3>
                <p><strong>Event:</strong> ${eventName}</p>
                ${isTeamEvent ? `<p><strong>Team:</strong> ${teamName}</p>` : ''}
                <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Time:</strong> ${new Date(eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Venue:</strong> ${venue}</p>
              </div>
              
              <p><strong>Important:</strong> Please be present at the venue 15 minutes before the event starts.</p>
              <p>View all your registrations and event details in your dashboard.</p>
              
              <div class="footer">
                <p>Department of Computer Applications</p>
                <p>PSG College of Technology, Coimbatore</p>
                <p>© 2026 Thiran. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Event registration email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send event registration email to ${email}:`, error);
  }
}

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
};
