const { DEPARTMENT_CODES, CURRENT_YEAR } = require('../config/constants');

/**
 * Parse roll number and extract information
 * Format: 25MX114
 * - First 2 digits: Year of admission (25 = 2025)
 * - Next 2 letters: Department code (MX = MCA)
 * - Last 3 digits: Student number
 */
function parseRollNumber(rollNumber) {
  // Convert to uppercase and remove spaces
  const cleanRollNumber = rollNumber.toUpperCase().trim();
  
  // Validate format: 2 digits + 2 letters + 3 digits
  const rollPattern = /^(\d{2})([A-Z]{2})(\d{3})$/;
  const match = cleanRollNumber.match(rollPattern);
  
  if (!match) {
    return {
      valid: false,
      error: 'Invalid roll number format. Expected format: 25MX114'
    };
  }
  
  const [, yearDigits, deptCode, studentNumber] = match;
  
  // Calculate admission year (e.g., 25 → 2025)
  const admissionYear = 2000 + parseInt(yearDigits);
  
  // Calculate current year of study
  // If admitted in 2025 and current year is 2026, then 1st year
  // If admitted in 2024 and current year is 2026, then 2nd year
  const yearOfStudy = CURRENT_YEAR - admissionYear;
  
  // Validate year of study (1-4)
  if (yearOfStudy < 1 || yearOfStudy > 4) {
    return {
      valid: false,
      error: `Invalid year of study calculated: ${yearOfStudy}. Roll number may be too old or invalid.`
    };
  }
  
  // Get department name
  const department = DEPARTMENT_CODES[deptCode];
  
  if (!department) {
    return {
      valid: false,
      error: `Unknown department code: ${deptCode}. Valid codes: ${Object.keys(DEPARTMENT_CODES).join(', ')}`
    };
  }
  
  // Generate email
  const email = `${cleanRollNumber.toLowerCase()}@psgtech.ac.in`;
  
  return {
    valid: true,
    rollNumber: cleanRollNumber,
    admissionYear,
    yearOfStudy,
    department,
    departmentCode: deptCode,
    studentNumber,
    email
  };
}

/**
 * Validate roll number format
 */
function validateRollNumber(rollNumber) {
  if (!rollNumber) {
    return {
      valid: false,
      error: 'Roll number is required'
    };
  }
  
  const result = parseRollNumber(rollNumber);
  return result;
}

/**
 * Format roll number to standard format
 */
function formatRollNumber(rollNumber) {
  return rollNumber.toUpperCase().trim();
}

/**
 * Get department list
 */
function getDepartmentList() {
  return Object.entries(DEPARTMENT_CODES).map(([code, name]) => ({
    code,
    name,
    example: `25${code}114`
  }));
}

module.exports = {
  parseRollNumber,
  validateRollNumber,
  formatRollNumber,
  getDepartmentList
};
