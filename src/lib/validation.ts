/**
 * Input validation utilities to prevent XSS and ensure data integrity
 */

// Email validation with security considerations
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email pattern with length limits
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  if (!emailPattern.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
};

// Phone number validation
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: true }; // Phone is optional
  }

  // Remove spaces and common separators
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanPhone.length < 8 || cleanPhone.length > 15) {
    return { isValid: false, error: 'Phone number must be 8-15 digits' };
  }

  if (!/^\+?[\d]+$/.test(cleanPhone)) {
    return { isValid: false, error: 'Phone number contains invalid characters' };
  }

  return { isValid: true };
};

// Display name validation
export const validateDisplayName = (name: string): { isValid: boolean; error?: string } => {
  if (!name) {
    return { isValid: false, error: 'Display name is required' };
  }

  if (name.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Display name is too long (max 100 characters)' };
  }

  // Prevent potential XSS in names
  if (/<script|javascript:|on\w+=/i.test(name)) {
    return { isValid: false, error: 'Display name contains invalid characters' };
  }

  return { isValid: true };
};

// Bio validation
export const validateBio = (bio: string): { isValid: boolean; error?: string } => {
  if (!bio) {
    return { isValid: true }; // Bio is optional
  }

  if (bio.length > 1000) {
    return { isValid: false, error: 'Bio is too long (max 1000 characters)' };
  }

  // Prevent potential XSS in bio
  if (/<script|javascript:|on\w+=/i.test(bio)) {
    return { isValid: false, error: 'Bio contains invalid characters' };
  }

  return { isValid: true };
};

// Address validation
export const validateAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address) {
    return { isValid: true }; // Address is optional
  }

  if (address.length > 200) {
    return { isValid: false, error: 'Address is too long (max 200 characters)' };
  }

  // Prevent potential XSS in address
  if (/<script|javascript:|on\w+=/i.test(address)) {
    return { isValid: false, error: 'Address contains invalid characters' };
  }

  return { isValid: true };
};

// Generic text sanitization
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Rate limiting helper for client-side
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const isRateLimited = (key: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const existing = requestCounts.get(key);

  if (!existing || now > existing.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (existing.count >= maxRequests) {
    return true;
  }

  existing.count++;
  return false;
};