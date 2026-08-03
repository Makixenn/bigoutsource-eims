import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { NotificationService } from './notification.service.js';

/**
 * Normalizes a date to midnight for accurate day difference calculations.
 */
function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculates the difference in days between two dates (futureDate - pastDate).
 */
function diffInDays(futureDate, pastDate) {
  const diffTime = futureDate.getTime() - pastDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const CronService = {
  start() {
    console.log('CronService initialized. Evaluation checks scheduled for 10:00 AM daily.');
    
    // Run at 10:00 AM every day
    cron.schedule('0 10 * * *', async () => {
      console.log('Running daily evaluation date checks...');
      try {
        await this.checkEvaluations();
      } catch (error) {
        console.error('Error in daily evaluation checks:', error);
      }
    });
  },

  async checkEvaluations(options = { todayOnly: false }) {
    // 1. Fetch active, unarchived employees who might have evaluations
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active',
        isArchived: false
      }
    });

    const now = normalizeDate(new Date());
    const employeeIds = employees.map(e => e.id);

    // Fetch existing 'eval_due' notifications for all these employees to prevent duplicates
    const allExistingNotifications = await prisma.notification.findMany({
      where: {
        entityId: { in: employeeIds },
        type: 'eval_due'
      }
    });

    const notificationsByEmployee = {};
    for (const notif of allExistingNotifications) {
      // For batched UI notifications, entityId might be null or 'batched_evals'
      // But we still need to track which employees were notified today.
      // We will store individual tracking records in details to know which employees were included in a batched notification.
      // Or we can query existing notifications by type = 'eval_due' and see if they were already notified.
      // Actually, if we use batched notifications, the entityId of the notification itself might be a generic string,
      // and the details would contain the array of employee IDs.
      // Let's change the tracking slightly: if there is ANY 'eval_due_batched' notification today, maybe we don't send again?
      // Wait, if it runs daily, we can just check if we already sent the daily batched notification!
      // But what if it runs twice? If we have a 'eval_due_batched' created today, we can just skip entirely.
    }

    const evaluationsToNotify = [];

    for (const employee of employees) {
      const milestones = [
        { label: '1st Month', field: 'evalFirstMonth' },
        { label: '3rd Month', field: 'evalThirdMonth' },
        { label: '5th Month', field: 'evalFifthMonth' },
        { label: '6th Month', field: 'evalSixthMonth' },
        { label: 'Anniversary', field: 'evalAnniversary' },
      ];

      const existingNotifications = notificationsByEmployee[employee.id] || [];

      for (const milestone of milestones) {
        const dateStr = employee[milestone.field];
        if (!dateStr) continue;

        const evalDate = normalizeDate(new Date(dateStr));
        
        // Skip invalid dates
        if (isNaN(evalDate.getTime())) continue;

        const daysUntil = diffInDays(evalDate, now);

        let timing = null;
        // Upcoming check (strictly 8 or 3 days before)
        if (!options.todayOnly && (daysUntil === 8 || daysUntil === 3)) {
          timing = 'upcoming';
        } 
        // Due today check (exactly 0 days)
        else if (daysUntil === 0) {
          timing = 'due_today';
        }

        if (timing) {
          // In the new batched approach, we will just accumulate them.
          // To prevent duplicates if the cron runs twice, we check if ANY batched notification was sent today.
          evaluationsToNotify.push({
            employee,
            milestone: milestone.label,
            dateStr,
            timing,
            daysUntil
          });
        }
      }
    }
    
    if (evaluationsToNotify.length > 0) {
      // Check if a batched notification was already sent today
      const alreadyBatched = await prisma.notification.findFirst({
        where: {
          type: 'eval_due_batched',
          createdAt: {
            gte: now
          }
        }
      });

      if (!alreadyBatched) {
        console.log(`Triggering batched notification for ${evaluationsToNotify.length} evaluations.`);
        await NotificationService.notifyBatchedEvaluationsDue(evaluationsToNotify);
      } else {
        console.log(`Batched evaluation notifications were already sent today.`);
      }
    }

    console.log('Daily evaluation date checks completed.');
  }
};
