import { prisma } from './backend/src/config/db.js';
async function test() {
  const emp = await prisma.employee.findFirst({ where: { is_archived: true } });
  if (!emp) { console.log('no archived employee'); return; }
  console.log('Found:', emp.id);
}
test().catch(console.error).finally(() => prisma.$disconnect());
