import fs from 'fs';
import {describe,it,expect} from 'vitest';
const page=fs.readFileSync('src/pages/VirP17Page.tsx','utf8');
const api=fs.readFileSync('src/api/virP17.ts','utf8');
const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');
const pages=fs.readFileSync('src/routing/routePages.ts','utf8');
const cockpit=fs.readFileSync('src/pages/VirManagerCockpitPage.tsx','utf8');
const sidebar=fs.readFileSync('src/components/Sidebar.tsx','utf8');

describe('Autonomous Operations Control workspace',()=>{
  it('registers the management route without a visible P-code title',()=>{
    expect(pages).toContain('VirP17Page');
    expect(routes).toContain('{ path: "/admin/vir/p17", element: R(MANAGEMENT, <VirP17Page />) }');
    expect(page).toContain("'Autonóm működésvezérlés','Autonomous Operations Control'");
    expect(page).not.toContain('VIR P17');
    expect(page).not.toContain('Nincs P17');
  });
  it('exposes the governed five-step workflow',()=>{
    for(const marker of ['previewP17Operation','approveP17Operation','executeP17Operation','verifyP17Operation','rollbackP17Operation'])expect(page).toContain(marker);
    for(const route of ['/vir/p17/preview','/vir/p17/operations','/approve','/execute','/verify','/rollback'])expect(api).toContain(route);
  });
  it('keeps first release side effects controlled',()=>{
    expect(page).toContain('nem indít külső kampányt');
    expect(page).toContain('does not trigger external campaigns');
  });
  it('links autonomous operations from cockpit and VIR sidebar bilingually',()=>{
    expect(cockpit).toContain("'/admin/vir/p17'");
    expect(cockpit).toContain("'Autonóm működésvezérlés','Autonomous Operations Control'");
    expect(sidebar).toContain("route:'/admin/vir/p17'");
    expect(sidebar).toContain("'/admin/vir/p17':{hu:'Autonóm működésvezérlés',en:'Autonomous Operations Control'}");
  });
});