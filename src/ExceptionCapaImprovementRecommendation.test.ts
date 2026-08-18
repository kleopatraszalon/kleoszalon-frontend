import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('CAPA detail exposes automatic improvement recommendation controls',()=>{const p=read('src/pages/ExceptionCapaPage.tsx');for(const x of ['AUTOMATIKUS FEJLESZTÉSI ESZKALÁCIÓ','Projekt javasolt','Megfigyelés','Vezető által elutasítva','Újraértékelés','Javaslat elutasítása'])expect(p).toContain(x);expect(p).toContain('/improvement-recommendation/refresh');expect(p).toContain('/improvement-recommendation/dismiss')});

test('recommendation reasons and suggested governance data are visible',()=>{const p=read('src/pages/ExceptionCapaPage.tsx');for(const x of ['Kritikus súlyosság','Magas súlyosság','Ismétlődő eltérés','Tömeges eltérés / outbreak','Több kapcsolt eset','Több adatforrás','Lejárt CAPA határidő','Javasolt felelős','Javasolt határidő','CAPA approval gate'])expect(p).toContain(x)});

test('frontend promotion is aligned with backend human-approved CAPA gate',()=>{const p=read('src/pages/ExceptionCapaPage.tsx');expect(p).toContain("String(selected.item.status)!=='approved'");expect(p).toContain("String(current.status)==='approved'");expect(p).toContain('Fejlesztési projekt csak ember által jóváhagyott CAPA rekordból indítható.');expect(p).toContain('A rendszer csak javasol. Fejlesztési projekt kizárólag ember által jóváhagyott CAPA-ból indítható')});

test('dismissal requires a meaningful management rationale',()=>{const p=read('src/pages/ExceptionCapaPage.tsx');expect(p).toContain('note.length<10');expect(p).toContain('legalább 10 karakteres vezetői indok')});
