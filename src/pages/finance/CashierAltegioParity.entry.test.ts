import fs from"fs";import path from"path";
const finance=fs.readFileSync(path.join(__dirname,"..","Penzugy.tsx"),"utf8");
const operations=fs.readFileSync(path.join(__dirname,"CashierAltegioOperationsPanel.tsx"),"utf8");
const shift=fs.readFileSync(path.join(__dirname,"CashRegisterShiftPanel.tsx"),"utf8");

test("keeps the existing Stage13 shift handover and close report workflow",()=>{expect(shift).toContain("/shift/current");expect(shift).toContain("handover");expect(shift).toContain("close-report");expect(finance).toContain("CashRegisterShiftPanel")});

test("adds denomination counts and previous closing count",()=>{expect(operations).toContain("Címletszámolás");expect(operations).toContain('/count');expect(operations).toContain("previous-count");expect(operations).toContain("Átadás előtti számolás");expect(operations).toContain("Záró számolás")});

test("adds multi-account manual income expense partner reference and transfer",()=>{expect(operations).toContain("/altegio/accounts");expect(operations).toContain("/altegio/document-types");expect(operations).toContain("/altegio/partners");expect(operations).toContain("/manual-operation");expect(operations).toContain("partner_id");expect(operations).toContain("employee_id");expect(operations).toContain("reference_no");expect(operations).toContain("/account-transfer")});

test("checkout uses configured payment methods account card brand fee and split tender",()=>{expect(finance).toContain("/altegio/payment-methods");expect(finance).toContain("finance_account_id");expect(finance).toContain("payment_method_code");expect(finance).toContain("card_brand");expect(finance).toContain("Tranzakciós díj");expect(finance).toContain("+ Fizetési mód hozzáadása");expect(finance).toContain("wallet, pont, kupon, bérlet és ajándékutalvány")});

test("payment history exposes partial and full refund action",()=>{expect(finance).toContain("/payments/${payment.id}/refund");expect(finance).toContain("Fizetések és visszatérítések");expect(finance).toContain("Visszatérítés");expect(finance).toContain("refunded_amount")});

test("checkout and cash operations remain blocked without an open shift",()=>{expect(finance).toContain("cashierShiftOpen");expect(finance).toContain("Fizetés rögzítéséhez előbb nyisd meg a pénztári műszakot");expect(finance).toContain("disabled={!cashierShiftOpen}")});
