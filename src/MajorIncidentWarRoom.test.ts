import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('Major Incident workspace exposes SEV impact command team action board timeline and post-mortem controls',()=>{const p=read('src/pages/MajorIncidentWarRoomPage.tsx');for(const marker of ['Major Incident / War Room','AUTOMATIC DETECTION · HUMAN COMMAND','SEV1 aktív','Commander hiányzik','War Room command team és impact','Incident lifecycle','Kapcsolt Exception case-ek','War Room action board','War Room update','War Room idővonal','Post-mortem'])expect(p).toContain(marker)});

test('War Room UI requires explicit resolution evidence and meaningful post-mortem content',()=>{const p=read('src/pages/MajorIncidentWarRoomPage.tsx');for(const marker of ['resolutionNote.trim().length<10','resolutionEvidence.trim().length<5','root_cause','impact_summary','lessons_learned','follow_up_actions',"source:'war-room-management'"])expect(p).toContain(marker)});

test('War Room actions require completion evidence and stakeholder updates remain logged only',()=>{const p=read('src/pages/MajorIncidentWarRoomPage.tsx');for(const marker of ['completion_evidence','Végrehajtási bizonyíték','stakeholder','A stakeholder update naplóbejegyzés'])expect(p).toContain(marker)});

test('finance adapter routes Major Incident before generic Exception route and restricts management',()=>{const p=read('src/pages/Penzugy.tsx');const major=p.indexOf('/finance/exception-command-center/major-incidents');const generic=p.indexOf('if(pathname.startsWith("/finance/exception-command-center"))');expect(major).toBeGreaterThan(-1);expect(generic).toBeGreaterThan(-1);expect(major).toBeLessThan(generic);expect(p).toContain('MajorIncidentWarRoomPage');expect(p).toContain('management ? <MajorIncidentWarRoomPage')});

test('System Health surfaces Major Incident readiness panel',()=>{const p=read('src/pages/SystemHealthPage.tsx');expect(p).toContain('MajorIncidentHealthPanel');const h=read('src/pages/MajorIncidentHealthPanel.tsx');for(const marker of ['SEV1 aktív','SEV2 aktív','Commander hiányzik','Lejárt akció','Post-mortem vár'])expect(h).toContain(marker)});
