import { ROLE_CAPABILITIES } from './src/config/capabilities.js';
import { RoleModel } from './src/models/role.model.js';
import { RoleService } from './src/services/role.service.js';

async function fix() {
  const roles = await RoleModel.findAll();
  for (const role of roles) {
    if (ROLE_CAPABILITIES[role.slug]) {
      const targetCaps = ROLE_CAPABILITIES[role.slug];
      console.log(`Updating ${role.slug}...`);
      await RoleModel.update(role.slug, { capabilities: targetCaps });
    }
  }
  RoleService.invalidate();
  console.log('Done syncing roles!');
}
fix().catch(console.error);
