import { UserProfileModel } from './src/models/userProfile.model.js';
async function test() {
  const users = await UserProfileModel.findAll();
  console.log(users.map(u => ({ email: u.email, role: u.role, overrides: u.capabilityOverrides })));
}
test().catch(console.error);
