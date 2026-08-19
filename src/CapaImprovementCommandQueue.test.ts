import fs from 'fs';import path from 'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('CAPA improvement command queue uses central API client and management queue endpoints',()=>{
  const p=read('src/pages/CapaImprovementCommandQueuePage.tsx');
  for(const marker of ["import api from '../api'",'/improvement-recommendations','/summary','Projektindításra kész','Felelős nélkül','Létrehozott projekt','80+ kockázat'])expect(p).toContain(marker);
  expect(p).not.toContain('onrender.com');
});

test('CAPA improvement command queue exposes risk owner project and salon filters',()=>{
  const p=read('src/pages/CapaImprovementCommandQueuePage.tsx');
  for(const marker of ["p.set('status'","p.set('risk'","p.set('owner'","p.set('project'","p.set('location_id'",'Csak kiválasztott telephely'])expect(p).toContain(marker);
});

test('finance adapter routes the specific improvement queue before generic CAPA route',()=>{
  const p=read('src/pages/Penzugy.tsx');
  const queue=p.indexOf('/finance/exception-command-center/capa/improvement-recommendations');
  const generic=p.indexOf('if(pathname.startsWith("/finance/exception-command-center/capa"))');
  expect(queue).toBeGreaterThan(-1);expect(generic).toBeGreaterThan(-1);expect(queue).toBeLessThan(generic);
  expect(p).toContain('CapaImprovementCommandQueuePage');
  expect(p).toContain('CAPA fejlesztési javaslatok');
});
