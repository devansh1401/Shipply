const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

async function cacheMiddleware(req, res, next) {
  const key = `cache:${req.url}`;
  const cachedResponse = await redis.get(key);

  if (cachedResponse) {
    res.send(JSON.parse(cachedResponse));
  } else {
    res.sendResponse = res.send;
    res.send = (body) => {
      redis.set(key, JSON.stringify(body), 'EX', 60); // Cache for 1 minute
      res.sendResponse(body);
    };
    next();
  }
}

module.exports = cacheMiddleware;
