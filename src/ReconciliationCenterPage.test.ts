import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('finance route exposes the reconciliation center',()=>{const p=read('src/pages/Penzugy.tsx');expect(p).toContain('/finance/reconciliation');expect(p).toContain('ReconciliationCenterPage');expect(p).toContain('Pénzügyi egyeztető központ')});

test('reconciliation UI shows the complete finance chain and stock equation',()=>{const p=read('src/pages/ReconciliationCenterPage.tsx');for(const label of ['Lezárt munkalap','Settlement','Rendezett fizetés','Pénzügyi tranzakció','Kassza','Számla','NAV','Könyvelés'])expect(p).toContain(label);expect(p).toContain('nyitókészlet + bevételezés + átadás be − felhasználás − értékesítés − selejt − átadás ki ± korrekció = zárókészlet');expect(p).toContain('/api/transactions/notifications/reconciliation')});

test('critical discrepancies are visible and manually rerunnable',()=>{const p=read('src/pages/ReconciliationCenterPage.tsx');expect(p).toContain('PIROS ELTÉRÉS');expect(p).toContain('PIROS KÉSZLETELTÉRÉS');expect(p).toContain('Futtatás és riasztás');expect(p).toContain('discrepancies')});
