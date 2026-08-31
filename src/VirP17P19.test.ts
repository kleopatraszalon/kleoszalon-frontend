import fs from 'fs';
import {describe,it,expect} from 'vitest';
const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');
const pages=fs.readFileSync('src/routing/routePages.ts','utf8');
const p16=fs.readFileSync('src/pages/VirP16Page.tsx','utf8');
const p17=fs.readFileSync('src/pages/VirP17Page.tsx','utf8');
const p18=fs.readFileSync('src/pages/VirP18Page.tsx','utf8');
const p19=fs.readFileSync('src/pages/VirP19Page.tsx','utf8');
const audit=fs.readFileSync('scripts/check-menu-routes.js','utf8');

describe('VIR P17-P19 unified release',()=>{
  it('registers management-protected routes and lazy pages',()=>{for(const n of ['17','18','19']){expect(routes).toContain(`/admin/vir/p${n}`);expect(routes).toContain(`R(MANAGEMENT, <VirP${n}Page />)`);expect(pages).toContain(`VirP${n}Page`)}});
  it('links the new control layers from executive intelligence',()=>{for(const route of ['/admin/vir/p17','/admin/vir/p18','/admin/vir/p19'])expect(p16).toContain(route)});
  it('keeps P17 approval verify rollback governance visible',()=>{expect(p17).toContain('Jóváhagyás');expect(p17).toContain('Visszagörgetés');expect(p17).toContain('there is no uncontrolled external')});
  it('makes P18 promote into P17 instead of direct execution',()=>{expect(p18).toContain('P17 jóváhagyásra küldés');expect(p18).toContain('P18 never changes bookings')});
  it('shows P19 7 30 90 day forecasting and limitations',()=>{expect(p19).toContain('<option value={7}>');expect(p19).toContain('<option value={30}>');expect(p19).toContain('<option value={90}>');expect(p19).toContain('not a guarantee of future revenue')});
  it('advances modular route invariant to 206',()=>expect(audit).toContain('routeMatches.length!==206'));
});
