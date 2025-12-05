// server/utils/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: Number(process.env.CACHE_TTL_MS) || 120, checkperiod: 60 });

module.exports = {
    get: (key) => cache.get(key),
    set: (key, value, ttl) => cache.set(key, value, ttl),
    del: (key) => cache.del(key),
};
