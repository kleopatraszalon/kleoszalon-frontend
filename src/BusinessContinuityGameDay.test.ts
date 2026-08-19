import fs from'fs';import path from'path';const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('GameDay workspace exposes safe simulation planning execution RTO RPO scorecard and actions',()=>{const p=read('src/pages/BusinessContinuityGameDayPage.tsx');for(const marker of ['SIMULATION ONLY','Üzletmenet-folytonossági GameDay','RTO/RPO','GameDay létrehozása','Szimulációs injectek','Független lezárás és scorecard','Automatikus improvement actions','observed_rto_minutes','observed_rpo_minutes'])expect(p).toContain(marker)});

test('GameDay UI uses management APIs with evidence based transitions',()=>{const p=read('src/pages/BusinessContinuityGameDayPage.tsx');for(const marker of ['/api/transactions/notifications/gameday','/templates','/service-readiness','/drills',"simple('start'","simple('verification'",'/complete','/injects/','evidence('])expect(p).toContain(marker)});

test('finance adapter routes GameDay before generic Exception Center and restricts management',()=>{const p=read('src/pages/Penzugy.tsx');const drill=p.indexOf('/finance/exception-command-center/gameday');const generic=p.indexOf('if(pathname.startsWith("/finance/exception-command-center"))');expect(drill).toBeGreaterThan(-1);expect(generic).toBeGreaterThan(-1);expect(drill).toBeLessThan(generic);expect(p).toContain('BusinessContinuityGameDayPage');expect(p).toContain('management ? <BusinessContinuityGameDayPage')});

test('System Health surfaces GameDay readiness panel',()=>{const p=read('src/pages/SystemHealthPage.tsx');expect(p).toContain('BusinessContinuityGameDayHealthPanel');const c=read('src/pages/BusinessContinuityGameDayHealthPanel.tsx');for(const marker of ['GameDay / DR drill readiness','Lejárt service drill','90 napos átlag','DRILL READY'])expect(c).toContain(marker)});

test('executive menu label translates GameDay',()=>{const p=read('src/utils/menuLabels.ts');expect(p).toContain("'Üzletmenet-folytonossági GameDay': 'Business Continuity GameDay'")});
