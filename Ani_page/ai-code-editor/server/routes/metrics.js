// server/routes/metrics.js
const express = require('express');
const router = express.Router();

let requestCount = 0;
let totalDuration = 0;

router.use((req, res, next) => {
    requestCount++;
    const start = Date.now();
    res.on('finish', () => {
        totalDuration += Date.now() - start;
    });
    next();
});

router.get('/', (req, res) => {
    const avg = requestCount ? totalDuration / requestCount : 0;
    res.json({ requestCount, averageMs: Math.round(avg) });
});

module.exports = router;
