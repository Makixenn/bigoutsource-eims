# Feature: Scheduled Tasks (Cron Jobs)

The EIMS backend utilizes automated background tasks (cron jobs) to handle periodic data checks, primarily for performance evaluations and system syncs.

## Architecture & Configuration

The system uses [`node-cron`](https://www.npmjs.com/package/node-cron) to schedule and execute tasks on the Node.js backend server. The central hub for these tasks is located at `backend/src/services/cron.service.js`.

To initialize the cron service, it is called once during the server boot process (typically in `server.js` or `index.js`):

```javascript
import { CronService } from './services/cron.service.js';

// Starts all scheduled background jobs
CronService.start();
```

## Existing Jobs

### 1. Daily Evaluation Date Checks
- **Schedule**: `0 8 * * *` (Runs every day at **08:00 AM** server time).
- **Service Method**: `CronService.checkEvaluations()`
- **Purpose**: Automatically scans the database for employees who have upcoming or overdue performance evaluations.

#### How It Works:
1. **Query**: Fetches all employees with `status: 'active'` and `isArchived: false`.
2. **Milestone Mapping**: Iterates over standard evaluation milestones:
   - 1st Month (`evalFirstMonth`)
   - 3rd Month (`evalThirdMonth`)
   - 5th Month (`evalFifthMonth`)
   - 6th Month (`evalSixthMonth`)
   - Anniversary (`evalAnniversary`)
3. **Date Math**: Calculates the difference in days between the normalized milestone date and "today".
   - If the evaluation is exactly **8 days** or **3 days** away, it is flagged as `upcoming`.
   - If the evaluation is exactly **0 days** away, it is flagged as `due_today`.
4. **Deduplication**: Checks the `Notification` table to see if a `eval_due_batched` notification was already sent today. This prevents duplicate emails if the Node server restarts or crashes.
5. **Dispatch**: If evaluations are found and no notification was sent today, it passes the data to `NotificationService.notifyBatchedEvaluationsDue()`, which sends the batched email table to HR administrators.

## Manual Triggering for Testing

If you need to test the evaluation logic locally without waiting for 08:00 AM, you can temporarily expose a test endpoint or call the service method directly with the `force` flag to bypass the deduplication check:

```javascript
// Example test route in development
app.get('/api/test/trigger-cron', async (req, res) => {
  await CronService.checkEvaluations({ todayOnly: false, force: true });
  res.send('Evaluation check triggered manually.');
});
```

> [!WARNING]
> Be careful when using the `force: true` flag in production, as it will bypass the daily deduplication check and send duplicate batched emails to your HR team.
