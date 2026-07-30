import { CronService } from './src/services/cron.service.js';

console.log('Manually triggering CronService.checkEvaluations()...');
CronService.checkEvaluations()
  .then(() => {
    console.log('Cron checks completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error running cron checks:', err);
    process.exit(1);
  });
