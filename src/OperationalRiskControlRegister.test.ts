import fs from'fs';import path from'path';const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('Operational Risk workspace exposes heatmap appetite controls KRI source chain and audit timeline',()=>{const p=read('src/pages/OperationalRiskControlRegisterPage.tsx');for(const marker of ['Operational Risk & Control Register','5×5 Risk Heatmap','Inherent','Residual','Control effectiveness','Key Risk Indicators','Source chain','Audit timeline','CONTROL LOOP','APPETITE FELETT'])expect(p).toContain(marker)});

test('Operational Risk UI uses management API for sync assessment controls tests and KRI',()=>{const p=read('src/pages/OperationalRiskControlRegisterPage.tsx');for(const marker of ['/api/transactions/notifications/risk-register','/summary','/risks','/controls','/tests','/kri','/measurements','evidence('])expect(p).toContain(marker)});

test('finance adapter routes risk register before generic Exception Center and restricts management',()=>{const p=read('src/pages/Penzugy.tsx');const risk=p.indexOf('/finance/exception-command-center/risk-register');const generic=p.indexOf('if(pathname.startsWith("/finance/exception-command-center"))');expect(risk).toBeGreaterThan(-1);expect(generic).toBeGreaterThan(-1);expect(risk).toBeLessThan(generic);expect(p).toContain('OperationalRiskControlRegisterPage');expect(p).toContain('management ? <OperationalRiskControlRegisterPage')});

test('System Health surfaces operational risk readiness panel',()=>{const p=read('src/pages/SystemHealthPage.tsx');expect(p).toContain('OperationalRiskControlHealthPanel');const c=read('src/pages/OperationalRiskControlHealthPanel.tsx');for(const marker of ['Operational Risk & Control readiness','Kritikus residual','Key control teszt esedékes','RISK CONTROL READY'])expect(c).toContain(marker)});

test('menu label supports Operational Risk & Control Register',()=>{const p=read('src/utils/menuLabels.ts');expect(p).toContain("'Operational Risk & Control Register': 'Operational Risk & Control Register'")});
