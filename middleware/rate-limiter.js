const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

async function rateLimiter(req, res, next) {
  const key = `ratelimit:${req.ip}`;
  const limit = 100; // Number of requests
  const window = 60; // Time window in seconds

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }

  if (current > limit) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  next();
}

module.exports = rateLimiter;
