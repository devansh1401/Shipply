const { PrismaClient } = require('@prisma/client');

const shards = [
  { url: process.env.DATABASE_URL_SHARD_1 },
  { url: process.env.DATABASE_URL_SHARD_2 },
  { url: process.env.DATABASE_URL_SHARD_3 },
];

const prismaClients = shards.map(
  (shard) => new PrismaClient({ datasources: { db: { url: shard.url } } })
);

function getShardForUser(userId) {
  return prismaClients[userId % shards.length];
}

module.exports = { getShardForUser };
