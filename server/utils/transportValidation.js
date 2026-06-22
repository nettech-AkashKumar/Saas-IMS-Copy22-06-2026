// src/utils/transportValidation.js

/**
 * Transport Number Validation Utilities
 * Supports manual entry and format validation
 */

// Configuration for numbering mode
export const NUMBERING_MODES = {
  AUTO: 'auto',           // System generates number
  MANUAL: 'manual',       // User enters number
  AUTO_WITH_OVERRIDE: 'auto_override'  // System suggests, user can change
};

// Configuration - can be moved to backend settings
const TRANSPORT_CONFIG = {
  lrNumberingMode: NUMBERING_MODES.MANUAL,  // Change as needed
  rrNumberingMode: NUMBERING_MODES.MANUAL,
  wagonNumberingMode: NUMBERING_MODES.MANUAL,
  trainNumberingMode: NUMBERING_MODES.MANUAL,
  
  // Format patterns
  lrPattern: /^LR\/[A-Z]{2,4}\/\d{4}\/\d{6,10}$/i,
  rrPattern: /^P[A-Z]{3}\d{4}-\d{6}$/,
  wagonPattern: /^[A-Z0-9]{4,15}$/i,
  trainPattern: /^[0-9]{4,6}$/,
  
  // Station codes for RR number
  stationCodes: {
    'NZM': 'Hazrat Nizamuddin',
    'NDLS': 'New Delhi',
    'CNB': 'Kanpur',
    'LKO': 'Lucknow',
    // Add more station codes as needed
  }
};

/**
 * Validate LR Number
 * Format: LR/STATION/YYYY/XXXXXX
 */
export const validateLRNumber = (lrNumber) => {
  if (!lrNumber || lrNumber.trim() === '') {
    return { isValid: false, error: 'LR Number is required' };
  }
  
  const isValid = TRANSPORT_CONFIG.lrPattern.test(lrNumber);
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Invalid LR format. Expected: LR/STATION/YYYY/XXXXXX (e.g., LR/DEL/2024/1234567890)' 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate RR Number (Railway Receipt)
 * Format: P + stationCode + YYYY + - + 6-digit number
 * Example: PNZM2024-123456
 */
export const validateRRNumber = (rrNumber) => {
  if (!rrNumber || rrNumber.trim() === '') {
    return { isValid: false, error: 'RR Number is required' };
  }
  
  const isValid = TRANSPORT_CONFIG.rrPattern.test(rrNumber);
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Invalid RR format. Expected: PXYZ2024-123456 (e.g., PNZM2024-123456)' 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate Wagon Number
 */
export const validateWagonNumber = (wagonNo) => {
  if (!wagonNo || wagonNo.trim() === '') {
    return { isValid: false, error: 'Wagon Number is required' };
  }
  
  const isValid = TRANSPORT_CONFIG.wagonPattern.test(wagonNo);
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Invalid Wagon Number format. Use 4-15 alphanumeric characters' 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate Train Number
 */
export const validateTrainNumber = (trainNo) => {
  if (!trainNo || trainNo.trim() === '') {
    return { isValid: false, error: 'Train Number is required' };
  }
  
  const isValid = TRANSPORT_CONFIG.trainPattern.test(trainNo);
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Invalid Train Number. Must be 4-6 digits' 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Generate LR Number automatically
 */
export const generateLRNumber = (stationCode = 'DEL') => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LR/${stationCode.toUpperCase()}/${year}/${random.slice(0, 6)}${sequence}`;
};

/**
 * Generate RR Number automatically
 */
export const generateRRNumber = (stationCode = 'NZM') => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `P${stationCode.toUpperCase()}${year}-${random}`;
};

/**
 * Generate Wagon Number automatically
 */
export const generateWagonNumber = () => {
  const prefix = 'WGN';
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}${random}`;
};

/**
 * Generate Train Number automatically
 */
export const generateTrainNumber = () => {
  // Random train number between 1000 and 99999
  return Math.floor(Math.random() * 90000 + 10000).toString();
};

/**
 * Get suggested number based on mode
 */
export const getSuggestedNumber = (type, stationCode = null) => {
  switch(type) {
    case 'LR':
      return generateLRNumber(stationCode);
    case 'RR':
      return generateRRNumber(stationCode);
    case 'WAGON':
      return generateWagonNumber();
    case 'TRAIN':
      return generateTrainNumber();
    default:
      return '';
  }
};

/**
 * Check if Railways API integration is active (placeholder - implement actual API call)
 */
export const isRailwayAPIActive = async () => {
  try {
    // This would be an actual API call to your backend
    // const response = await api.get('/api/settings/railway-integration');
    // return response.data.isActive;
    
    // For now, return false (manual mode)
    return false;
  } catch (error) {
    console.error('Error checking railway API status:', error);
    return false;
  }
};

/**
 * Validate RR number with FOIS/PMS API (placeholder)
 */
export const validateWithRailwayAPI = async (rrNumber, stationCode) => {
  try {
    // This would call your backend which then calls FOIS/PMS API
    // const response = await api.post('/api/railways/validate-rr', { rrNumber, stationCode });
    // return response.data;
    
    // For now, just return format validation
    return validateRRNumber(rrNumber);
  } catch (error) {
    console.error('Railway API validation error:', error);
    return { isValid: false, error: 'Failed to validate with Railways system' };
  }
};