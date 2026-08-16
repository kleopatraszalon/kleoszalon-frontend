import fs from'fs';
import path from'path';

describe('Provisioning recovery center contract',()=>{
 const panel=fs.readFileSync(path.join(process.cwd(),'src/pages/ProvisioningRecoveryPanel.tsx'),'utf8');
 const page=fs.readFileSync(path.join(process.cwd(),'src/pages/SaasFranchiseAdminPage.tsx'),'utf8');
 test('shows only incomplete non-root tenants and derives the next recovery step',()=>{
  expect(panel).toContain("r.slug!=='kleopatra'");
  expect(panel).toContain('!r.onboarding_ready');
  expect(panel).toContain('onboarding_next_step');
  expect(panel).toContain('Provisioning recovery center');
 });
 test('retries only known admin invitations through the existing protected platform API',()=>{
  expect(panel).toContain('/admin-invitation');
  expect(panel).toContain("['pending','expired','revoked']");
  expect(panel).toContain('admin_invitation_email');
  expect(panel).toContain('Admin meghívó újraküldése');
 });
 test('is mounted before the detailed onboarding editor',()=>{
  expect(page).toContain('<ProvisioningRecoveryPanel/>');
  expect(page.indexOf('<ProvisioningRecoveryPanel/>')).toBeLessThan(page.indexOf('<TenantOnboardingPanel/>'));
 });
});
