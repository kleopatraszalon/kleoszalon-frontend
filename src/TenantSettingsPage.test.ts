import{describe,expect,it}from"vitest";
import{readFileSync}from"node:fs";
import{join}from"node:path";

const root=process.cwd();
const page=readFileSync(join(root,"src/pages/TenantSettingsPage.tsx"),"utf8");
const routes=readFileSync(join(root,"src/routing/tenantSettingsRoutes.tsx"),"utf8");

describe("tenant settings control center",()=>{
 it("registers the tenant-local management route",()=>{
  expect(routes).toContain('path: "/settings/tenant"');
  expect(routes).toContain("MANAGEMENT_ROLES");
 });
 it("uses authenticated SaaS context and has no tenant picker",()=>{
  expect(page).toContain('api.get("/saas/context")');
  expect(page).toContain('api.get("/saas/locations")');
  expect(page).toContain('api.get("/saas/subscription")');
  expect(page).not.toMatch(/tenantId.*setTenantId|setTenant.*select/i);
 });
 it("exposes all seven tenant settings sections",()=>{
  for(const label of["Általános","Telephelyek","Felhasználók","Szerepkörök","Modulok","Előfizetés","Biztonság"])expect(page).toContain(label);
 });
 it("keeps employee RBAC in the existing access control surface",()=>{
  expect(page).toContain('/admin/access-control');
 });
});
