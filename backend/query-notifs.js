import { NotificationModel } from './src/models/notification.model.js';
import { prisma } from './src/config/db.js';
async function test() {
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(notifs.map(n => ({ id: n.id, type: n.type, message: n.message, details: typeof n.details === 'string' ? JSON.parse(n.details) : n.details, to: n.recipientId })));
}
test().catch(console.error);
