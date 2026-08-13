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
  expect(sidebar).toMatch(/translateMenuLabel/);
  expect(audit).toMatch(/UnifiedFilterToolbar/);
  expect(master).toMatch(/system-hardening/);
  expect(master).toMatch(/\/archive/);
});
