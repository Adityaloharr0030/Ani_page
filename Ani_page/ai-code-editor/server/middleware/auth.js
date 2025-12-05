/**
 * Simple authentication middleware
 * In production, implement proper JWT or session-based auth
 */

module.exports = (req, res, next) => {
  // For now, just pass through
  // In production, verify JWT token or session
  next();
};

