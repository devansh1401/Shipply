const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

async function enqueue(queue, message) {
  await redis.rpush(queue, JSON.stringify(message));
}

async function dequeue(queue) {
  const message = await redis.lpop(queue);
  return message ? JSON.parse(message) : null;
}

async function processQueue(queue, handler) {
  while (true) {
    const message = await dequeue(queue);
    if (message) {
      await handler(message);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait if queue is empty
    }
  }
}

module.exports = { enqueue, dequeue, processQueue };
