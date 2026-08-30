import fs from 'fs';
import { describe,it,expect } from 'vitest';

describe('VIR P4 advanced workspace contracts',()=>{
 it('exposes all P4 intelligence tabs and APIs',()=>{
  const page=fs.readFileSync('src/pages/VirP4Page.tsx','utf8');
  const api=fs.readFileSync('src/api/virP4.ts','utf8');
  for(const label of ['22. Smart Shift Generator','23. Employee Revenue Coach','24. Service Portfolio Optimizer','25. Cannibalization Detector']) expect(page).toContain(label);
  for(const route of ['/vir/p4/smart-shift-generator','/vir/p4/employee-revenue-coach','/vir/p4/service-portfolio','/vir/p4/cannibalization']) expect(api).toContain(route);
  expect(page).toContain('JÓVÁHAGYÁS KELL');
  expect(page).toContain('Nincs automatikus HR-intézkedés');
  expect(page).toContain('nem bizonyít kannibalizációt');
 });
});
