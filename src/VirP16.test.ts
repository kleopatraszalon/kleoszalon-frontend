import fs from 'fs';
import {describe,it,expect} from 'vitest';
const page=fs.readFileSync('src/pages/VirP16Page.tsx','utf8');
const api=fs.readFileSync('src/api/virP16.ts','utf8');
const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');
const pages=fs.readFileSync('src/routing/routePages.ts','utf8');
const sidebar=fs.readFileSync('src/components/Sidebar.tsx','utf8');
const audit=fs.readFileSync('scripts/check-menu-routes.js','utf8');
describe('VIR P16 Executive Intelligence 2.0',()=>{
 it('registers P16 route and lazy page',()=>{expect(pages).toContain('VirP16Page');expect(routes).toContain('/admin/vir/p16');expect(routes).toContain('R(MANAGEMENT, <VirP16Page />)')});
 it('exposes executive exception and decision APIs',()=>{for(const x of ['/vir/p16/status','/vir/p16/exception-brief','/vir/p16/decision-inbox/sync','/vir/p16/decision-inbox','/vir/p16/morning-brief'])expect(api).toContain(x)});
 it('keeps P16 non autonomous',()=>{expect(page).toContain('Automatikus végrehajtás');expect(page).toContain('a döntés rögzítése nem indít automatikus foglalást, kampányt, kedvezményt, pénzügyi műveletet vagy beosztásmódosítást')});
 it('places P1-P16 in a dedicated localized Intelligence sidebar group without a visible VIR prefix',()=>{for(let i=1;i<=16;i++)expect(sidebar).toContain(`/admin/vir/p${i}`);for(const x of ["name:'Intelligencia'","?'Intelligence':'Intelligencia'",'Üzleti intelligencia','Bevételi autopilóta','Revenue Autopilot','Vezetői intelligencia','Executive Intelligence'])expect(sidebar).toContain(x);for(const x of ['VIR intelligencia','VIR Intelligence','Marketing Automation P9','Revenue Autopilot P10','AI Reception & Journey P11','Customer Journey P12','Revenue Protection P13','Operations Autopilot P14','Executive Autopilot P15','Executive Intelligence P16'])expect(sidebar).not.toContain(x)});
 it('keeps receptionist guest actions and salon operations shortcut visible without P code',()=>{expect(sidebar).toContain("name:'Vendégakciók'");expect(sidebar).toContain("route:'/admin/reception/guest-actions'");expect(sidebar).toContain("name:'Működési autopilóta'");expect(sidebar).not.toContain("name:'Operations Autopilot P14'")});
 it('tracks the current route invariant',()=>expect(audit).toContain('routeMatches.length!==206'));
});
