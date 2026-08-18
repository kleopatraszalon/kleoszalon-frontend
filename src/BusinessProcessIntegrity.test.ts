import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('reconciliation center exposes end-to-end process integrity tab',()=>{const p=read('src/pages/ReconciliationCenterPage.tsx');expect(p).toContain('Folyamatintegritás');expect(p).toContain('/process-integrity');expect(p).toContain('END-TO-END BUSINESS PROCESS INTEGRITY');expect(p).toContain('Központi kivétellista')});

test('process UI covers finance stock procurement and system controls',()=>{const p=read('src/pages/ReconciliationCenterPage.tsx');for(const x of ['Pénzügyi lánc','Készletintegritás','Beszerzési lánc','Rendszer-invariáns','Foglalás → munkalap → fizetés → settlement → kassza → pénzügyi tranzakció → számla → NAV → főkönyv'])expect(p).toContain(x)});

test('system health surfaces previous-day business process integrity',()=>{const panel=read('src/pages/ProcessIntegrityHealthPanel.tsx');const page=read('src/pages/SystemHealthPage.tsx');expect(panel).toContain('/api/transactions/notifications/reconciliation/process-integrity');expect(panel).toContain('Üzleti folyamatintegritás');expect(page).toContain('ProcessIntegrityHealthPanel')});
