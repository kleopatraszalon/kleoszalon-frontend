import fs from "fs";
import path from "path";

test("finance v5 workspace contains the requested operational areas",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"src/pages/finance/FinanceWorkspacePage.tsx"),"utf8");
  for(const label of ["Számlák és pénztárak","Partnerek","Bizonylat típusok","Pénzügyi műveletek","Dokumentumok","Online fizetés","Jelentések","Fizetési módok és díjak","Beállítások"]){
    expect(source).toContain(label);
  }
  expect(source).toContain('/api/transactions/finance-v5');
  expect(source).toContain(`/movements/\${id}/cancel`);
  expect(source).toContain('/partners/sync-suppliers');
  expect(source).toContain('/reports/pl');
  expect(source).toContain('/reports/daily-cash');
  expect(source).toContain('fee_percent');
  expect(source).toContain('online_booking_prepayment');
});

test("finance v5 adapter keeps cashier checkout, invoice and NAV flows separate",()=>{
  const adapter=fs.readFileSync(path.join(process.cwd(),"src/pages/Penzugy.tsx"),"utf8");
  const routes=fs.readFileSync(path.join(process.cwd(),"src/routing/financeRoutes.tsx"),"utf8");
  expect(adapter).toContain('FinanceWorkspacePage');
  expect(adapter).toContain('PenzugyLegacy');
  expect(adapter).toContain('pathname === "/finance/checkout"');
  expect(adapter).toContain('pathname.startsWith("/finance/invoices/")');
  expect(routes).toContain('path: "/finance/nav-online-invoice"');
  expect(routes).toContain('path: "/finance/*"');
});
