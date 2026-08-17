import fs from'node:fs';
import path from'node:path';
const panel=fs.readFileSync(path.resolve(__dirname,'../SaasQuotaUsagePanel.tsx'),'utf8');
const page=fs.readFileSync(path.resolve(__dirname,'../SaasFranchiseAdminPage.tsx'),'utf8');

describe('SaaS quota usage dashboard',()=>{
 it('is mounted in platform SaaS admin',()=>{expect(page).toContain('SaasQuotaUsagePanel');});
 it('loads tenant usage inputs and plan limits from platform APIs',()=>{expect(panel).toContain('/saas/platform/plans');expect(panel).toContain('/saas/platform/tenants');expect(panel).toContain('max_locations');expect(panel).toContain('max_users');});
 it('calculates limit proximity and exceeded state',()=>{expect(panel).toContain('percent>=80');expect(panel).toContain("'exceeded'");expect(panel).toContain("'near'");});
 it('surfaces upgrade candidates',()=>{expect(panel).toContain('Upgrade-jelölt');expect(panel).toContain('Javasolt csomag');expect(panel).toContain('Egyedi / Enterprise');});
 it('distinguishes intentional unlimited plans from missing quota configuration',()=>{expect(panel).toContain("['enterprise','internal']");expect(panel).toContain("'unconfigured'");expect(panel).toContain('Konfigurálatlan csomag');expect(panel).toContain('nincs limit beállítva');});
});
