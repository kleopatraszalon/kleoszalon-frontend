import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('Exception Command Center exposes executive radar and triage tools',()=>{const p=read('src/pages/ExceptionCommandCenterPage.tsx');for(const marker of ['Exception Command Center','KRITIKUS','SLA SÉRTETT','KIOSZTATLAN','MTTA / MTTR','SLA és routing','Automatikus szinkron futtatása','Lezárás bizonyítékkal'])expect(p).toContain(marker)});

test('Exception Command Center supports ownership workflow audit and export',()=>{const p=read('src/pages/ExceptionCommandCenterPage.tsx');for(const marker of ['/summary','/cases','/routing-rules','/export.csv','/cases/bulk','/comment','owner_name','resolution_evidence'])expect(p).toContain(marker)});

test('finance route adapter exposes Exception Command Center',()=>{const p=read('src/pages/Penzugy.tsx');expect(p).toContain('ExceptionCommandCenterPage');expect(p).toContain('/finance/exception-command-center')});
