import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('resilience workspace exposes RTO RPO runbooks change freeze emergency override and all clear',()=>{const p=read('src/pages/ResilienceRecoveryPage.tsx');for(const marker of ['Resilience & Recovery','RTO/RPO','CHANGE-FREEZE','Emergency change override','two-person rule','ALL CLEAR','runbook','release_ref','duration_minutes','second-person-approval'])expect(p).toContain(marker)});

test('resilience UI uses governed management APIs and explicit verification evidence',()=>{const p=read('src/pages/ResilienceRecoveryPage.tsx');for(const marker of ['/summary','/sessions','/services','/all-clear','/overrides','/decision','verification_note','evidence:{description','window.confirm'])expect(p).toContain(marker)});

test('finance adapter routes resilience before generic exception route and restricts management',()=>{const p=read('src/pages/Penzugy.tsx');const resilience=p.indexOf('/finance/exception-command-center/resilience');const generic=p.indexOf('if(pathname.startsWith("/finance/exception-command-center"))');expect(resilience).toBeGreaterThan(-1);expect(generic).toBeGreaterThan(-1);expect(resilience).toBeLessThan(generic);expect(p).toContain('ResilienceRecoveryPage');expect(p).toContain('management ? <ResilienceRecoveryPage')});

test('system health surfaces resilience recovery readiness panel',()=>{const p=read('src/pages/SystemHealthPage.tsx');expect(p).toContain('ResilienceRecoveryHealthPanel');const c=read('src/pages/ResilienceRecoveryHealthPanel.tsx');for(const marker of ['Business continuity readiness','Aktív change-freeze','RTO sértés','RPO sértés','Override függőben'])expect(c).toContain(marker)});

test('executive menu labels translate resilience and major incident controls',()=>{const p=read('src/utils/menuLabels.ts');expect(p).toContain("'Major Incident / War Room': 'Major Incident / War Room'");expect(p).toContain("'Resilience & Recovery': 'Resilience & Recovery'")});
