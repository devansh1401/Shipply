import { PrismaClient } from '@prisma/client';

// Augment the NodeJS global type to include our prisma property
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
