import fs from 'fs';
import {describe,it,expect} from 'vitest';
const page=fs.readFileSync('src/pages/VirP11Page.tsx','utf8');const api=fs.readFileSync('src/api/virP11.ts','utf8');const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');const pages=fs.readFileSync('src/routing/routePages.ts','utf8');const cockpit=fs.readFileSync('src/pages/VirManagerCockpitPage.tsx','utf8');const audit=fs.readFileSync('scripts/check-menu-routes.js','utf8');
describe('VIR P11 AI Reception & Customer Journey 3.0',()=>{
 it('contains the three P11 capabilities bilingually',()=>{for(const x of ['56. Full AI Receptionist','57. AI Conversation Memory','58. AI Complaint Assistant','Teljes AI-recepciós','AI panaszasszisztens'])expect(page).toContain(x)});
 it('keeps booking and compensation controlled',()=>{expect(page).toContain('Automatikus foglalás, pénzvisszatérítés vagy kompenzáció nincs.');expect(page).toContain('automatikus kompenzáció és pénzvisszatérítés: NEM');});
 it('exposes P11 APIs',()=>{for(const x of ['/vir/p11/status','/vir/p11/receptionist/preview','/vir/p11/conversation-memory/','/vir/p11/complaints/analyze','/vir/p11/complaints'])expect(api).toContain(x)});
 it('registers and links management P11 route without visible P label',()=>{expect(pages).toContain('VirP11Page');expect(routes).toContain('/admin/vir/p11');expect(routes).toContain('R(MANAGEMENT, <VirP11Page />)');expect(cockpit).toContain('/admin/vir/p11');expect(cockpit).toContain('AI-recepció és vendégút');expect(cockpit).not.toContain('AI Reception & Journey P11');});
 it('tracks modular route invariant',()=>expect(audit).toContain('routeMatches.length!==204'));
});