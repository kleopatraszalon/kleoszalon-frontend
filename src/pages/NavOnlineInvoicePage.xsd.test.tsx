import fs from'fs';import path from'path';

test('NAV admin exposes fail-closed XSD runtime and invoice validation controls',()=>{const source=fs.readFileSync(path.join(__dirname,'NavOnlineInvoicePage.tsx'),'utf8');expect(source).toContain('/api/transactions/nav-online-invoice/xsd-status');expect(source).toContain('/xsd-validate');expect(source).toContain('XSD hiba');expect(source).toContain('XSD motorhiba');expect(source).toContain('nav_xsd_validation_status');expect(source).toContain('fail-closed');expect(source).toContain('tokenExchange/manageInvoice')});
