// Advanced Error Handler 
class AIEditorError extends Error { 
  constructor(message, type, details) { 
    super(message); this.type = type; this.details = details; 
  } 
} 
const errorHandler = (err, req, res, next) => { 
  console.error('Error:', err); 
    error: err.message, type: err.type, details: err.details 
  }); 
}; 
module.exports = { AIEditorError, errorHandler }; 

