// Input sanitization utilities to prevent XSS and injection attacks

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  let sanitized = input;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
}

export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  
  // Allow: letters, numbers, dash, underscore, dot, space
  // Remove: path traversal, special chars
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');
  
  return sanitized.trim();
}

export function sanitizeSQLInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove SQL special characters
  let sanitized = input.replace(/[;--]/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');
  
  return sanitized.trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}
