// Collaboration System 
const socketIo = require('socket.io'); 
class CollaborationManager { 
  constructor(server) { this.io = socketIo(server); this.setupEvents(); } 
  setupEvents() { 
    this.io.on('connection', (socket) => { 
      socket.on('codeChange', (data) => socket.broadcast.emit('codeUpdate', data)); 
    }); 
  } 
} 
module.exports = CollaborationManager; 

