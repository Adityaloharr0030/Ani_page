// Security Enhancements 
const rateLimit = require('express-rate-limit'); 
const helmet = require('helmet'); 
const securityMiddleware = [ 
  helmet({ contentSecurityPolicy: { directives: { 
    defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"] 
  }}}), 
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }) 
]; 
module.exports = { securityMiddleware }; 

