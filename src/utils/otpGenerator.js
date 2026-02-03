const crypto = require('crypto');

function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
}

function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  generateOTP,
  generateToken,
};
