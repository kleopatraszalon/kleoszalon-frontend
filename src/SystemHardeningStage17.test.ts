import fs from "fs";
import path from "path";
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),"utf8");

test("Stage17 idle hardening checks expiry before focus activity",()=>{
  const session=read("src/utils/authSession.ts");
  const layout=read("src/layouts/AppLayout.tsx");
  expect(session).toMatch(/5\s*\*\s*60\s*\*\s*1000/);
  expect(layout).toMatch(/verifyThenRegisterActivity/);
  expect(layout).toMatch(/elapsed\s*>=\s*IDLE_TIMEOUT_MS/);
});

test("Stage17 uses shared language, audit, recycle-bin and filter infrastructure",()=>{
  const index=read("src/index.tsx");
  const sidebar=read("src/components/Sidebar.tsx");
  const audit=read("src/pages/AuditLogPage.tsx");
  const master=read("src/pages/CentralMasterDataPage.tsx");
  expect(index).toMatch(/LanguageProvider/);
  expect(sidebar).toMatch(/canonicalMenuLabel/);
  expect(sidebar).toMatch(/menuLabel/);
  expect(sidebar).toMatch(/useLanguage/);
  expect(audit).toMatch(/UnifiedFilterToolbar/);
  expect(master).toMatch(/system-hardening/);
  expect(master).toMatch(/\/archive/);
});

test("Stage17 bilingual coverage includes login, staff and CRM operational pages",()=>{
  const dictionary=read("src/i18n/LanguageProvider.tsx");
  const login=read("src/pages/Login.tsx");
  const staff=read("src/pages/EmployeesList.tsx");
  const crm=read("src/pages/ClientsCRMCore.tsx");
  expect(dictionary).toMatch(/"staff\.title"/);
  expect(dictionary).toMatch(/"crm\.new_customer"/);
  expect(login).toMatch(/useLanguage/);
  expect(login).toMatch(/LanguageSwitcher/);
  expect(staff).toMatch(/useLanguage/);
  expect(staff).toMatch(/staff\.search/);
  expect(crm).toMatch(/useLanguage/);
  expect(crm).toMatch(/crm\.tab\./);
  expect(crm).toMatch(/Intl\.DateTimeFormat\(locale/);
});

test("Stage17 bilingual coverage includes service and product master catalogs",()=>{
  const services=read("src/pages/ServicesCatalogPage.tsx");
  const products=read("src/pages/ProductCatalogPage.tsx");
  const newService=read("src/components/ServiceNewModal.tsx");
  expect(services).toMatch(/useLanguage/);
  expect(services).toMatch(/toLocaleString\(locale\)/);
  expect(services).toMatch(/Active only/);
  expect(products).toMatch(/useLanguage/);
  expect(products).toMatch(/toLocaleString\(locale\)/);
  expect(products).toMatch(/Other product type/);
  expect(products).toMatch(/All subcategories/);
  expect(newService).toMatch(/useLanguage/);
  expect(newService).toMatch(/Add new service/);
  expect(newService).toMatch(/parent_service_id/);
  expect(newService).toMatch(/promo_valid_from/);
  expect(newService).toMatch(/online_bookable/);
  expect(newService).toMatch(/is_combo/);
});
