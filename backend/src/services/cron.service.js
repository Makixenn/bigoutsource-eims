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

  async checkEvaluations() {
    // 1. Fetch active, unarchived employees who might have evaluations
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active',
        isArchived: false
      }
    });

    const now = normalizeDate(new Date());

    for (const employee of employees) {
      const milestones = [
        { label: '1st Month', field: 'eval_first_month' },
        { label: '3rd Month', field: 'eval_third_month' },
        { label: '5th Month', field: 'eval_fifth_month' },
        { label: '6th Month', field: 'eval_sixth_month' },
        { label: 'Anniversary', field: 'eval_anniversary' },
      ];

      // Fetch existing 'eval_due' notifications for this employee to prevent duplicates
      const existingNotifications = await prisma.notification.findMany({
        where: {
          entityId: employee.id,
          type: 'eval_due'
        }
      });

      for (const milestone of milestones) {
        const dateStr = employee[milestone.field];
        if (!dateStr) continue;

        const evalDate = normalizeDate(new Date(dateStr));
        
        // Skip invalid dates
        if (isNaN(evalDate.getTime())) continue;

        const daysUntil = diffInDays(evalDate, now);

        // Target: 1 week and a day before (8 days)
        // We trigger if it's exactly 8 days away, or if it was missed (between 0 and 8 days)
        if (daysUntil <= 8 && daysUntil >= 0) {
          
          // Check if we already notified them for this specific milestone
          const alreadyNotified = existingNotifications.some(n => {
            const parsed = typeof n.details === 'string' ? JSON.parse(n.details) : n.details;
            return parsed?.milestone === milestone.label;
          });

          if (!alreadyNotified) {
            console.log(`Triggering notification for ${employee.name || employee.id} - ${milestone.label} (Due: ${dateStr})`);
            await NotificationService.notifyEvaluationDue({
              employee,
              milestone: milestone.label,
              dateStr
            });
          }
        }
      }
    }
    
    console.log('Daily evaluation date checks completed.');
  }
};
