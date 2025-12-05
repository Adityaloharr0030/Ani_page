// server/middleware/logger.js
const fs = require('fs');
const path = require('path');
const logStream = fs.createWriteStream(path.join(__dirname, '..', 'server.log'), { flags: 'a' });

function logger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const entry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            duration,
            ip: req.ip,
        };
        logStream.write(JSON.stringify(entry) + '\n');
    });
    next();
}

module.exports = { logger };
