const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Testing connection with URL:', process.env.DATABASE_URL);
  try {
    await prisma.$connect();
    const events = await prisma.event.findMany();
    console.log('Successfully connected! Events found:', events.length);
  } catch (e) {
    console.error('Connection failed! Error details:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
