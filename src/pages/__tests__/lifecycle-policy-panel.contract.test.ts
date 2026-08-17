import fs from'node:fs';
import path from'node:path';
const panel=fs.readFileSync(path.resolve(__dirname,'../LifecyclePolicyPanel.tsx'),'utf8');
const page=fs.readFileSync(path.resolve(__dirname,'../SaasFranchiseAdminPage.tsx'),'utf8');

describe('Lifecycle policy admin panel',()=>{
 it('is mounted in SaaS admin composition',()=>{expect(page).toContain('LifecyclePolicyPanel');});
 it('supports persisted warning and grace configuration',()=>{expect(panel).toContain('/lifecycle-policy/config');expect(panel).toContain('trial_warning_days');expect(panel).toContain('trial_grace_days');});
 it('exposes notification queue preparation and audit-safe apply',()=>{expect(panel).toContain('prepare-notifications');expect(panel).toContain('/lifecycle-policy/apply');expect(panel).toContain('Értesítési queue előkészítése');});
 it('shows warning grace suspend and pending queue KPIs',()=>{expect(panel).toContain('Trial figyelmeztetés');expect(panel).toContain('Grace állapot');expect(panel).toContain('Felfüggesztési jelölt');expect(panel).toContain('Queue-ban vár');});
});
