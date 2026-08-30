import fs from 'fs';
import path from 'path';

const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

describe('VIR role route access integrity',()=>{
  const roles=read('src/utils/roles.ts');
  const access=read('src/routing/routeAccess.tsx');
  const finance=read('src/routing/financeRoutes.tsx');
  const admin=read('src/routing/adminRoutes.tsx');

  it('does not implicitly promote accounting to admin or management',()=>{
    expect(roles).not.toContain('actual.includes("accounting")&&(wanted.has("manager")||wanted.has("admin"))');
    expect(access).toContain('export const ADMIN_ROLES = ["admin"] as const');
    expect(access).toContain('export const MANAGEMENT_ROLES = ["admin", "manager"] as const');
  });

  it('grants accounting only through an explicit finance role set',()=>{
    expect(access).toContain('export const FINANCE_ROLES = ["admin", "manager", "accounting"] as const');
    expect(finance).toContain('FINANCE_ROLES as FINANCE');
    expect(finance).not.toContain('MANAGEMENT_ROLES as MANAGEMENT');
    expect(finance).not.toContain('ADMIN_ROLES as ADMIN');
  });

  it('keeps finance and reporting routes on the finance-specific guard',()=>{
    for(const route of [
      '/finance/nav-online-invoice',
      '/reports/top-metrics',
      '/reports/profit',
      '/reports/inventory-movement',
      '/reports/expected-revenue',
      '/reports/custom',
      '/reports/builder',
      '/reports/management-tools',
    ]){
      const line=finance.split('\n').find(candidate=>candidate.includes(`path: "${route}"`));
      expect(line).toBeTruthy();
      if(line?.includes('element:')) expect(line).toContain('R(FINANCE,');
    }
    expect(finance).toContain('element: R(FINANCE, <NavOnlineInvoicePage />)');
  });

  it('does not widen VIR administration routes to accounting',()=>{
    expect(admin).toContain('{ path: "/admin/access-control", element: R(ADMIN, <AccessControlPage />) }');
    expect(admin).toContain('{ path: "/admin/vir", element: R(MANAGEMENT, <VirManagerCockpitPage />) }');
    expect(admin).not.toContain('FINANCE_ROLES as FINANCE');
  });
});
