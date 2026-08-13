import fs from "fs";
import path from "path";

test("finance v5 workspace contains the requested operational areas",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"src/pages/finance/FinanceWorkspacePage.tsx"),"utf8");
  for(const label of ["Számlák és pénztárak","Partnerek","Bizonylat típusok","Pénzügyi műveletek","Dokumentumok","Online fizetés","Jelentések","Fizetési módok és díjak","Beállítások"]){
    expect(source).toContain(label);
  }
  expect(source).toContain('/api/transactions/finance-v5');
  expect(source).toContain('/movements/${id}/cancel');
  expect(source).toContain('/partners/sync-suppliers');
  expect(source).toContain('/reports/pl');
  expect(source).toContain('/reports/daily-cash');
  expect(source).toContain('fee_percent');
  expect(source).toContain('online_booking_prepayment');
});

test("finance v5 routes keep cashier checkout and NAV invoice paths separate",()=>{
  const app=fs.readFileSync(path.join(process.cwd(),"src/App.tsx"),"utf8");
  expect(app).toContain('FinanceWorkspacePage');
  expect(app).toContain('path: "/finance/checkout"');
  expect(app).toContain('path: "/finance/nav-online-invoice"');
  expect(app).toContain('path: "/finance/*"');
});
