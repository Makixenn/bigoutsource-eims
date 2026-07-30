import { prisma } from './src/config/db.js';
async function test() {
  const users = await prisma.userProfile.findMany({
    where: { email: { in: ['ojt@bigoutsource.ph', 'eims@bigoutsource.ph', 'lyndonmicboss@outlook.com'] } }
  });
  console.log(users.map(u => ({ email: u.email, role: u.role })));
}
test().catch(console.error);
