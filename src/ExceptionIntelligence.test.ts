import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('Exception Intelligence exposes health trend root cause recurrence and performance controls',()=>{const p=read('src/pages/ExceptionIntelligencePage.tsx');for(const marker of ['Exception Intelligence','EXCEPTION HEALTH SCORE','Root-cause klaszter','Ismétlődési esemény','Telephelyi hotspotok','Csapat response performance','Felelősi response performance','Legutóbbi eszkalációk','Automatikus eszkalációs mátrix'])expect(p).toContain(marker)});

test('Exception Intelligence connects to dashboard cycle rules and executive brief APIs',()=>{const p=read('src/pages/ExceptionIntelligencePage.tsx');for(const marker of ['/intelligence/dashboard','/intelligence/run','/intelligence/escalation-rules','/intelligence/brief/','morning','evening'])expect(p).toContain(marker)});

test('finance adapter routes Intelligence before generic Exception Command Center route',()=>{const p=read('src/pages/Penzugy.tsx');const intelligence=p.indexOf('/finance/exception-command-center/intelligence');const generic=p.indexOf('if(pathname.startsWith("/finance/exception-command-center"))');expect(intelligence).toBeGreaterThan(-1);expect(generic).toBeGreaterThan(-1);expect(intelligence).toBeLessThan(generic);expect(p).toContain('ExceptionIntelligencePage')});
