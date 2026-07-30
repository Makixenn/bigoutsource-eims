import { prisma } from './src/config/db.js';
async function test() {
  const users = await prisma.userProfile.findMany({
    where: { email: 'lyndonmicboss@outlook.com' }
  });
  console.log(users);
}
test().catch(console.error);
