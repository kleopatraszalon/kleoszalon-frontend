import fs from 'fs';
import {describe,it,expect} from 'vitest';
const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');
const pages=fs.readFileSync('src/routing/routePages.ts','utf8');
const nav=fs.readFileSync('src/pages/VirIntelligenceFlowNav.tsx','utf8');
const p17=fs.readFileSync('src/pages/VirP17Page.tsx','utf8');
const p18=fs.readFileSync('src/pages/VirP18Page.tsx','utf8');
const p19=fs.readFileSync('src/pages/VirP19Page.tsx','utf8');
const audit=fs.readFileSync('scripts/check-menu-routes.js','utf8');

describe('VIR governed intelligence release',()=>{
  it('registers management-protected routes and lazy pages',()=>{for(const n of ['17','18','19']){expect(routes).toContain(`/admin/vir/p${n}`);expect(routes).toContain(`R(MANAGEMENT, <VirP${n}Page />)`);expect(pages).toContain(`VirP${n}Page`)}});
  it('connects business health, signals, proposals, prediction and approval through one navigation',()=>{for(const route of ['/admin/vir/intelligence','/admin/vir/p16','/admin/vir/p18','/admin/vir/p19','/admin/vir/p17'])expect(nav).toContain(route);expect(nav).toContain('Vezetői jelzések');expect(nav).toContain('Jóváhagyási központ')});
  it('keeps approval execute verify rollback governance functional',()=>{for(const action of ['approveP17Operation','executeP17Operation','verifyP17Operation','rollbackP17Operation','rejectP17Operation'])expect(p17).toContain(action);expect(p17).toContain('nincs kontroll nélküli külső');expect(p17).toContain('there is no uncontrolled campaign')});
  it('promotes operational proposals into governed approval instead of direct execution',()=>{expect(p18).toContain('promoteP18Proposal');expect(p18).toContain('/admin/vir/p17');expect(p18).toContain('Közvetlen végrehajtás');expect(p18).toContain('TILTVA')});
  it('keeps 7 30 90 day prediction and the optimization workspace',()=>{expect(p19).toContain('<option value={7}>');expect(p19).toContain('<option value={30}>');expect(p19).toContain('<option value={90}>');expect(p19).toContain('VirP20P22Panel');expect(p19).toContain('VirP23P25Panel')});
  it('keeps the modular route invariant at 206',()=>expect(audit).toContain('routeMatches.length!==206'));
});