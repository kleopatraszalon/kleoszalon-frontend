import fs from'fs';import path from'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('executive AI UI covers all requested management questions',()=>{const p=read('src/pages/ExecutiveAiAssistantPage.tsx');for(const q of ['Miért csökkent ma a forgalom?','Melyik dolgozó kapacitása alacsony?','Hol nőtt a no-show?','Melyik készlet fogy el?','Melyik telephely tér el az átlagtól?','Milyen akciót érdemes indítani?','Hol várható létszámhiány?','Mely panasz sürgős?'])expect(p).toContain(q)});

test('executive AI UI exposes automation, manual brief, questioning and analyst-only safety',()=>{const p=read('src/pages/ExecutiveAiAssistantPage.tsx');expect(p).toContain('/api/transactions/ai-support/executive');expect(p).toContain('Vezetői brief most');expect(p).toContain('Automatikus briefek');expect(p).toContain('Autonóm műveletek:');expect(p).toContain('nem indít kampányt');expect(p).toContain('/ask')});

test('finance route adapter exposes the executive AI page',()=>{const p=read('src/pages/Penzugy.tsx');expect(p).toContain('ExecutiveAiAssistantPage');expect(p).toContain('/finance/executive-ai');expect(p).toContain('AI vezetői asszisztens')});
