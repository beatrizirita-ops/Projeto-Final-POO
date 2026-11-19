import pkg from '@prisma/client';

// Suporte tanto para import CJS quanto ESM no Deno / Node
const { PrismaClient } = (pkg as unknown as { default?: { PrismaClient: typeof pkg.PrismaClient }; PrismaClient: typeof pkg.PrismaClient }).PrismaClient 
  ? (pkg as unknown as { PrismaClient: typeof pkg.PrismaClient })
  : ((pkg as unknown as { default: { PrismaClient: typeof pkg.PrismaClient } }).default || pkg);

// Instância única (Singleton) do Prisma Client para toda a aplicação
export const prisma = new PrismaClient();
