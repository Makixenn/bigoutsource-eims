import { NotificationService } from './src/services/notification.service.js';
import { UserProfileModel } from './src/models/userProfile.model.js';
import { EmployeeModel } from './src/models/employee.model.js';

async function test() {
  const actor = await UserProfileModel.findById('ed745bae-fbb8-41aa-8564-46bf7b50b823');
  const allEmps = await EmployeeModel.findAll();
  const employee = allEmps[0];
  
  console.log('Sending unarchive notif...');
  await NotificationService.notifyEmployeeUnarchived({ employee, actor });
  console.log('Done');
}
test().catch(console.error);
