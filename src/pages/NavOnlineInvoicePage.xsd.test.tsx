import fs from'fs';import path from'path';

test('NAV admin exposes separated fail-closed XSD runtime and invoice validation controls',()=>{
 const source=fs.readFileSync(path.join(__dirname,'NavOnlineInvoicePage.tsx'),'utf8');
 expect(source).toContain('/api/transactions/nav-online-invoice/runtime-status');
 expect(source).toContain('/api/transactions/nav-online-invoice/bootstrap-status');
 expect(source).toContain('/xsd-validate');
 expect(source).toContain('XSD hiba');
 expect(source).toContain('XSD motorhiba');
 expect(source).toContain('nav_xsd_validation_status');
 expect(source).toContain('fail-closed');
 expect(source).toContain('Munkalap → számla → üzleti validáció → hivatalos XSD → NAV adatszolgáltatás');
});

test('NAV admin exposes automatic queue worker controls without weakening live safety',()=>{
 const source=fs.readFileSync(path.join(__dirname,'NavOnlineInvoicePage.tsx'),'utf8');
 expect(source).toContain('/api/transactions/nav-online-invoice/queue-worker/status');
 expect(source).toContain('/api/transactions/nav-online-invoice/queue-worker/run-now');
 expect(source).toContain('/api/transactions/nav-online-invoice/automation');
 expect(source).toContain('/queue/${id}/retry');
 expect(source).toContain('Automatikus beküldés');
 expect(source).toContain('Csak TEST automatikusan');
 expect(source).toContain('Bizonytalan manageInvoice hálózati eredménynél nem küld újra automatikusan');
});
