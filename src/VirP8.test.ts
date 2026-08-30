import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const page=fs.readFileSync('src/pages/VirP8Page.tsx','utf8');
const api=fs.readFileSync('src/api/virP8.ts','utf8');
const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');
const pages=fs.readFileSync('src/routing/routePages.ts','utf8');

test('P8 management workspace is registered',()=>{assert.ok(routes.includes('/admin/vir/p8'));assert.ok(routes.includes('VirP8Page'));assert.ok(pages.includes('VirP8Page'));});
test('P8 exposes all six roadmap tabs',()=>{for(const label of ['45. Omnichannel Identity Hub','46. Universal Inbox','47. AI Receptionist 2.0','48. Empty Slot Revenue Recovery','49. Channel Optimizer','50. Conversation Revenue Attribution'])assert.ok(page.includes(label));});
test('P8 API client covers all communication revenue endpoints',()=>{for(const path of ['/vir/p8/layer-status','/vir/p8/identity-hub','/vir/p8/inbox','/vir/p8/ai-receptionist/handoff','/vir/p8/empty-slot-recovery','/vir/p8/channel-optimizer','/vir/p8/revenue-attribution'])assert.ok(api.includes(path));});
test('P8 UI preserves consent autonomy and attribution disclosures',()=>{assert.ok(page.includes('Consent + approval boundary'));assert.ok(page.includes('automatic_send=false'));assert.ok(page.includes('Nem állít kauzalitást'));assert.ok(page.includes('nem azonos a fizetett ledger-revenue-val'));});
