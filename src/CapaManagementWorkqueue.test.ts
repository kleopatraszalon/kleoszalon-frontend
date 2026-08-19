import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('CAPA management workqueue exposes tenant-wide risk prioritization and summary KPIs',()=>{const p=read('src/pages/CapaManagementWorkqueuePage.tsx');for(const marker of ['CAPA vezetői munkasor','Projekt javasolt','Kritikus','Lejárt','Kiosztatlan','Visszaigazolásra vár','Projektre kész','Kapcsolt projekt'])expect(p).toContain(marker)});

test('CAPA management workqueue uses governed backend endpoints without hard-coded production host',()=>{const p=read('src/pages/CapaManagementWorkqueuePage.tsx');for(const marker of ['/api/transactions/notifications/exceptions/intelligence/capa/improvement-workqueue','/improvement-workqueue/assign','/improvement-workqueue/acknowledge','/escalations/preview','api.get','api.post'])expect(p).toContain(marker);expect(p).not.toContain('onrender.com')});

test('management assignment supports owner team notification evidence and acknowledgement',()=>{const p=read('src/pages/CapaManagementWorkqueuePage.tsx');for(const marker of ['Felelős azonosító / e-mail','Felelős csapat','Felelős kijelölése és értesítése','Kijelölés visszaigazolása','delivery evidence','notification?.sent','notification?.logged'])expect(p).toContain(marker)});

test('management escalation UI shows opt-in runtime status and safe no-send preview',()=>{const p=read('src/pages/CapaManagementWorkqueuePage.tsx');for(const marker of ['Automatikus vezetői eszkaláció','escalation_enabled','acknowledgement_grace_hours','escalation_cooldown_minutes','Eszkaláció előnézet','Az előnézet nem küld e-mailt.','preview.candidates','preview.attempts'])expect(p).toContain(marker)});

test('workqueue keeps project creation behind CAPA approval governance',()=>{const p=read('src/pages/CapaManagementWorkqueuePage.tsx');expect(p).toContain('nem hoz létre projektet automatikusan');expect(p).toContain('ember által jóváhagyott CAPA-ból');expect(p).not.toContain('/promote')});

test('finance adapter routes workqueue before generic CAPA route and restricts it to management',()=>{const p=read('src/pages/Penzugy.tsx');const work=p.indexOf('/finance/exception-command-center/capa/workqueue');const capa=p.indexOf('if(pathname.startsWith("/finance/exception-command-center/capa"))');expect(work).toBeGreaterThan(-1);expect(capa).toBeGreaterThan(-1);expect(work).toBeLessThan(capa);expect(p).toContain('management ? <CapaManagementWorkqueuePage')});
