import fs from 'fs';
import path from 'path';

const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('critical management routes remain reachable',()=>{
  const finance=read('src/pages/Penzugy.tsx');
  const app=read('src/App.tsx');
  expect(finance).toContain('/finance/reconciliation');
  expect(finance).toContain('ReconciliationCenterPage');
  expect(finance).toContain('/finance/executive-ai');
  expect(finance).toContain('ExecutiveAiAssistantPage');
  expect(app).toContain('/admin/system-health');
  expect(app).toContain('SystemHealthPage');
});

test('critical management menu names stay canonical',()=>{
  const labels=read('src/utils/menuLabels.ts');
  expect(labels).toContain("'Pénzügyek': 'Pénzügy és pénztár'");
  expect(labels).toContain("'Vezetői riportok': 'Statisztika és VIR'");
  expect(labels).toContain("'Rendszerellenőrzés': 'Rendszerállapot'");
  expect(labels).toContain("'AI vezetői asszisztens': 'AI executive assistant'");
  expect(labels).toContain("'Pénzügyi egyeztető központ': 'Financial reconciliation center'");
});

test('system status page still contains release control and APM',()=>{
  const page=read('src/pages/SystemHealthPage.tsx');
  expect(page).toContain('ReleaseControlCenter');
  expect(page).toContain('ObservabilityApmPanel');
});
