import fs from'fs';import path from'path';
const page=fs.readFileSync(path.join(__dirname,'pages/ReleaseControlCenter.tsx'),'utf8');
const health=fs.readFileSync(path.join(__dirname,'pages/SystemHealthPage.tsx'),'utf8');
test('Release Control Center is the first system health workspace',()=>{expect(health).toContain("import ReleaseControlCenter from './ReleaseControlCenter'");expect(health).toContain('<ReleaseControlCenter/>')});
test('Release Control Center exposes strict server-side GO NO-GO state',()=>{for(const x of['Release Control Center','RELEASE READY','Élesítést blokkoló tételek','NO-GO','GO – a kötelező release gate-ek és az üzleti folyamatok teljesülnek'])expect(page).toContain(x)});
test('Release evidence can be recorded for the current release',()=>{expect(page).toContain('/api/transactions/release-control/evidence');expect(page).toContain('Bizonyíték / workflow run / jegyzet / SHA');expect(page).toContain("source:'vir-admin'")});
