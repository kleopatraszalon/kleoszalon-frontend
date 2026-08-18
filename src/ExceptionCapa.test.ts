import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('CAPA workspace exposes human approval corrective preventive and verification controls',()=>{const p=read('src/pages/ExceptionCapaPage.tsx');for(const marker of ['CAPA központ','HUMAN APPROVAL REQUIRED','Gyökérok-hipotézis','Javító intézkedés','Megelőző intézkedés','Jóváhagyási workflow','Verifikációs jegyzet','Kapcsolt Exception case-ek','Audit történet'])expect(p).toContain(marker)});

test('CAPA verified transition requires explicit user-entered evidence',()=>{const p=read('src/pages/ExceptionCapaPage.tsx');for(const marker of ["verificationNote.trim()","verificationEvidence.trim()","verification.length<10","evidence.length<5","description:evidence","source:'management-verification'"])expect(p).toContain(marker);expect(p).not.toContain("verificationEvidence||'Vezetői verifikációs bizonyíték rögzítve.'")});

test('CAPA UI uses governed summary list sync detail and update API',()=>{const p=read('src/pages/ExceptionCapaPage.tsx');for(const marker of ['/summary','/sync','api.get(`${BASE}/${id}`)','api.patch(`${BASE}/${selected.item.id}`'])expect(p).toContain(marker)});

test('finance adapter routes CAPA before generic exception route and restricts management',()=>{const p=read('src/pages/Penzugy.tsx');const capa=p.indexOf('/finance/exception-command-center/capa');const generic=p.indexOf('if(pathname.startsWith("/finance/exception-command-center"))');expect(capa).toBeGreaterThan(-1);expect(generic).toBeGreaterThan(-1);expect(capa).toBeLessThan(generic);expect(p).toContain('ExceptionCapaPage');expect(p).toContain('management ? <ExceptionCapaPage')});

test('system health surfaces Exception Intelligence health panel',()=>{const p=read('src/pages/SystemHealthPage.tsx');expect(p).toContain('ExceptionIntelligenceHealthPanel')});