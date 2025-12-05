/**
 * utils/sanitize.js - Input sanitization and validation
 */

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Limit length
  sanitized = sanitized.substring(0, 50000);
  
  // Trim excessive whitespace
  sanitized = sanitized.replace(/\s{10,}/g, ' '.repeat(10));
  
  return sanitized;
}

function validateSQL(query) {
  const forbidden = [
    /drop\s+(?:table|database|schema|view|index)/i,
    /delete\s+from/i,
    /update\s+\w+\s+set/i,
    /insert\s+into/i,
    /alter\s+table/i,
    /create\s+(?:table|database|index)/i,
    /truncate\s+table/i,
    /grant\s+/i,
    /revoke\s+/i
  ];
  
  return !forbidden.some(pattern => pattern.test(query));
}

function escapeHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return str.replace(/[&<>"'/]/g, m => map[m]);
}

module.exports = {
  sanitizeInput,
  validateSQL,
  escapeHTML
};

