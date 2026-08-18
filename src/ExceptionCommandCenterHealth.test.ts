import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('System Health surfaces Exception Command Center operational status',()=>{const page=read('src/pages/SystemHealthPage.tsx');expect(page).toContain('ExceptionCommandCenterHealthPanel');const panel=read('src/pages/ExceptionCommandCenterHealthPanel.tsx');for(const marker of ['Exception Command Center Health','Kritikus','Nyitott','SLA sértett','Kiosztatlan','/finance/exception-command-center','/summary'])expect(panel).toContain(marker)});
