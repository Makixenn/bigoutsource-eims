import { NotificationService } from './src/services/notification.service.js';
import { UserProfileModel } from './src/models/userProfile.model.js';
import { EmployeeModel } from './src/models/employee.model.js';

async function test() {
  const actor = await UserProfileModel.findById('ed745bae-fbb8-41aa-8564-46bf7b50b823');
  let employee;
  const allEmps = await EmployeeModel.findAll();
  employee = allEmps[0];
  
  console.log('Sending final archive notif...');
  await NotificationService.notifyEmployeeArchived({ employee, actor, isComplete: true });
  console.log('Done');
}
test().catch(console.error);
