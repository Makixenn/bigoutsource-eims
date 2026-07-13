import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  for (const role of roles) {
    const newCaps = role.capabilities.filter(c => c !== 'employees.fields.hr' && c !== 'employees.fields.it' && !c.includes('hr_identity') && !c.includes('hr_compensation') && !c.includes('it_hardware') && !c.includes('it_software') && !c.includes('completion'));
    if (newCaps.length !== role.capabilities.length) {
      await prisma.role.update({
        where: { slug: role.slug },
        data: { capabilities: newCaps }
      });
      console.log('Updated role ' + role.slug);
    }
  }
  
  const users = await prisma.userProfile.findMany();
  for (const user of users) {
    const newCaps = user.capabilityOverrides.filter(c => c !== 'employees.fields.hr' && c !== 'employees.fields.it' && !c.includes('hr_identity') && !c.includes('hr_compensation') && !c.includes('it_hardware') && !c.includes('it_software') && !c.includes('completion'));
    if (newCaps.length !== user.capabilityOverrides.length) {
      await prisma.userProfile.update({
        where: { id: user.id },
        data: { capabilityOverrides: newCaps }
      });
      console.log('Updated user overrides ' + user.id);
    }
  }
  
  console.log('Cleanup done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
