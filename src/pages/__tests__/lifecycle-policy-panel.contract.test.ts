import fs from'node:fs';
import path from'node:path';
const panel=fs.readFileSync(path.resolve(__dirname,'../LifecyclePolicyPanel.tsx'),'utf8');
const page=fs.readFileSync(path.resolve(__dirname,'../SaasFranchiseAdminPage.tsx'),'utf8');

describe('Lifecycle policy admin panel',()=>{
 it('is mounted in SaaS admin composition',()=>{expect(page).toContain('LifecyclePolicyPanel');});
 it('supports persisted warning and grace configuration',()=>{expect(panel).toContain('/lifecycle-policy/config');expect(panel).toContain('trial_warning_days');expect(panel).toContain('trial_grace_days');});
 it('exposes notification queue preparation and audit-safe apply',()=>{expect(panel).toContain("action('prepare-notifications'");expect(panel).toContain("action('apply'");expect(panel).toContain('Értesítési queue előkészítése');});
 it('shows warning grace suspend and queue KPIs',()=>{expect(panel).toContain('Trial figyelmeztetés');expect(panel).toContain('Grace állapot');expect(panel).toContain('Felfüggesztési jelölt');expect(panel).toContain('Queue pending');});
 it('shows scheduler health and manual run control',()=>{expect(panel).toContain('/lifecycle-policy/health');expect(panel).toContain("action('run-now'");expect(panel).toContain('Scheduler futtatása most');expect(panel).toContain('Scheduler futástörténet');});
 it('supports dead-letter retry for failed notifications',()=>{expect(panel).toContain(`notifications/\${id}/retry`);expect(panel).toContain('Dead-letter / failed');expect(panel).toContain('Újrapróbálás');});
 it('shows ops alerts and acknowledgement resolution controls',()=>{expect(panel).toContain('/lifecycle-policy/alerts');expect(panel).toContain("action('alerts/reconcile'");expect(panel).toContain("'acknowledge'");expect(panel).toContain("'resolve'");expect(panel).toContain('Operátori riasztások');});
});
