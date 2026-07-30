import { RoleModel } from './src/models/role.model.js';
async function test() {
  const role = await RoleModel.findBySlug('hr2_admin');
  console.log('hr2_admin caps:', role.capabilities.filter(c => c.includes('archive')));
}
test().catch(console.error);
