import fs from 'fs';
import {describe,it,expect} from 'vitest';
const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');
const pages=fs.readFileSync('src/routing/routePages.ts','utf8');
const cockpit=fs.readFileSync('src/pages/VirManagerCockpitPage.tsx','utf8');
const audit=fs.readFileSync('scripts/check-menu-routes.js','utf8');
const p12=fs.readFileSync('src/pages/VirP12Page.tsx','utf8');
const p13=fs.readFileSync('src/pages/VirP13Page.tsx','utf8');
const p14=fs.readFileSync('src/pages/VirP14Page.tsx','utf8');
const p15=fs.readFileSync('src/pages/VirP15Page.tsx','utf8');
describe('VIR P12-P15 management workspaces',()=>{
 it('registers all four pages and routes',()=>{for(const n of ['12','13','14','15']){expect(pages).toContain(`VirP${n}Page`);expect(routes).toContain(`/admin/vir/p${n}`);expect(routes).toContain(`R(MANAGEMENT, <VirP${n}Page />)`)}});
 it('links all four waves from manager cockpit',()=>{for(const x of ['Journey Orchestration P12','Revenue Protection P13','Operations Autopilot P14','Executive Autopilot P15'])expect(cockpit).toContain(x)});
 it('exposes controlled P12-P15 capability wording',()=>{expect(p12).toContain('Automatikus ügyfélprofil-módosítás és automatikus outreach nincs.');expect(p13).toContain('Automatikus terhelés vagy kedvezmény: NEM.');expect(p14).toContain('Automatikus beosztásmódosítás: NEM.');expect(p15).toContain('Jóváhagyás után sincs automatikus végrehajtás.')});
 it('keeps the new modular route invariant',()=>expect(audit).toContain('routeMatches.length!==203'));
});
