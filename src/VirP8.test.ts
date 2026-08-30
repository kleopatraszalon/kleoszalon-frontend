import fs from 'node:fs';
import{describe,it,expect}from'vitest';
const page=fs.readFileSync('src/pages/VirP8Page.tsx','utf8');
const api=fs.readFileSync('src/api/virP8.ts','utf8');
const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');
const pages=fs.readFileSync('src/routing/routePages.ts','utf8');

describe('VIR P8 communication revenue automation',()=>{
  it('registers the management workspace',()=>{expect(routes).toContain('/admin/vir/p8');expect(routes).toContain('VirP8Page');expect(pages).toContain('VirP8Page');});
  it('exposes all six roadmap tabs',()=>{for(const label of ['45. Omnichannel Identity Hub','46. Universal Inbox','47. AI Receptionist 2.0','48. Empty Slot Revenue Recovery','49. Channel Optimizer','50. Conversation Revenue Attribution'])expect(page).toContain(label);});
  it('covers all communication revenue endpoints',()=>{for(const path of ['/vir/p8/layer-status','/vir/p8/identity-hub','/vir/p8/inbox','/vir/p8/ai-receptionist/handoff','/vir/p8/empty-slot-recovery','/vir/p8/channel-optimizer','/vir/p8/revenue-attribution'])expect(api).toContain(path);});
  it('surfaces provider callbacks and paid-ledger attribution',()=>{expect(page).toContain('Consent + approval boundary');expect(page).toContain('automatic_send=false');expect(page).toContain('Delivery/read/click');expect(page).toContain('work_order_payments');expect(page).toContain('Fizetett bevétel');expect(page).toContain('Nem állít kauzalitást');});
});
