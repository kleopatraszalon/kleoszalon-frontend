import fs from'fs';
import path from'path';

const panel=fs.readFileSync(path.join(__dirname,'CashRegisterSessionPanel.tsx'),'utf8');
const finance=fs.readFileSync(path.join(__dirname,'..','Penzugy.tsx'),'utf8');
const sidebar=fs.readFileSync(path.join(__dirname,'..','..','components','Sidebar.tsx'),'utf8');

test('cash register exposes the daily physical till lifecycle',()=>{
  expect(panel).toContain('/api/transactions/cashier/sessions/open');
  expect(panel).toContain('/api/transactions/cashier/cash-movements');
  expect(panel).toContain('/api/transactions/cashier/register-daily-close');
  expect(panel).toContain('/api/transactions/cashier/register-state');
});

test('daily close requires a manually entered counted cash value',()=>{
  expect(panel).toContain("countedCash.trim()!==''");
  expect(panel).toContain('disabled={loading||!hasCountedCash}');
  expect(panel).toContain('ténylegesen megszámolt készpénzzel');
});

test('finance workspace renders the cashier register panel',()=>{
  expect(finance).toContain("import CashRegisterSessionPanel from'./finance/CashRegisterSessionPanel'");
  expect(finance).toContain('<CashRegisterSessionPanel');
});

test('location menu exposes cashier only through explicit cashier roles',()=>{
  expect(sidebar).toContain("const canCashier=rk.some");
  expect(sidebar).toContain("canCashier?LOCATION:LOCATION.filter(m=>m.id!==99205)");
  expect(sidebar).toContain("name:'Pénztár'");
});
