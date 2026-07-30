import { NotificationService } from './src/services/notification.service.js';
import { UserProfileModel } from './src/models/userProfile.model.js';
import { EmployeeModel } from './src/models/employee.model.js';
import { RoleService } from './src/services/role.service.js';

async function test() {
  const actor = await UserProfileModel.findById('ed745bae-fbb8-41aa-8564-46bf7b50b823');
  const allEmps = await EmployeeModel.findAll();
  const employee = allEmps[0];
  
  const recipients = await UserProfileModel.findAll({ status: 'active' });
  for (const r of recipients) {
    if (r.email === 'lyndonmicboss@outlook.com') {
        const caps = await RoleService.resolveUserCapabilities(r);
        console.log('lyndon caps:', caps.filter(c => c.includes('archive')));
    }
  }

  console.log('Sending final archive notif...');
  await NotificationService.notifyEmployeeArchived({ employee, actor, isComplete: true });
}
test().catch(console.error);
