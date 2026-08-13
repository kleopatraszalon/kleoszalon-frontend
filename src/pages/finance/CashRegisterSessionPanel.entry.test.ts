import fs from'fs';
import path from'path';

const panel=fs.readFileSync(path.join(__dirname,'CashRegisterSessionPanel.tsx'),'utf8');
const finance=fs.readFileSync(path.join(__dirname,'..','Penzugy.tsx'),'utf8');
const sidebar=fs.readFileSync(path.join(__dirname,'..','..','components','Sidebar.tsx'),'utf8');

test('cash register supports multiple registers and the full daily till lifecycle',()=>{
 expect(panel).toContain('/api/transactions/cashier/registers');
 expect(panel).toContain('/api/transactions/cashier/sessions/open');
 expect(panel).toContain('/api/transactions/cashier/cash-movements');
 expect(panel).toContain('/api/transactions/cashier/register-daily-close');
 expect(panel).toContain('/api/transactions/cashier/register-state');
 expect(panel).toContain('Készpénz nélküli számla');
});

test('denomination count interim check cashier handover and prior close are visible',()=>{
 expect(panel).toContain('Címletszámolás és ellenőrzés');
 expect(panel).toContain("saveCheck('check')");
 expect(panel).toContain("saveCheck('handover')");
 expect(panel).toContain('Pénztár átadása');
 expect(panel).toContain('/register-history?date=');
 expect(panel).toContain('Előző záró');
});

test('register-to-register transfer and manual income expense are available',()=>{
 expect(panel).toContain('/api/transactions/cashier/transfers');
 expect(panel).toContain('Pénztárközi átvezetés');
 expect(panel).toContain('Tranzakció típusa');
 expect(panel).toContain('Hivatkozási / bizonylatszám');
});

test('checkout uses configured payment methods registers card brands fees and refunds',()=>{
 expect(finance).toContain('/api/transactions/cashier/payment-methods');
 expect(finance).toContain('/api/transactions/cashier/registers');
 expect(finance).toContain('payment_method_code');
 expect(finance).toContain('card_brand');
 expect(finance).toContain('Tranzakciós díj');
 expect(finance).toContain('/refund');
 expect(finance).toContain('Fizetések és visszatérítések');
});

test('finance workspace keeps restricted cashier mode and role-specific menu',()=>{
 expect(finance).toContain("window.location.pathname.startsWith('/finance/cashier')");
 expect(finance).toContain('!cashierOnly&&');
 expect(sidebar).toContain("const canCashier=rk.some");
 expect(sidebar).toContain("canCashier?LOCATION:LOCATION.filter(m=>m.id!==99205)");
 expect(sidebar).toContain("name:'Pénztár',icon:'WalletCards',route:'/finance/cashier'");
});
