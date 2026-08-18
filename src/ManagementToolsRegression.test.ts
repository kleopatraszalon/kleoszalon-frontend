import fs from 'fs';
import path from 'path';

const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('top metrics keeps the Altegio parity indicators visible',()=>{
  const page=read('src/pages/VirTopMetricsPage.tsx');
  expect(page).toContain('ALTEGIO-PARITÁS');
  expect(page).toContain('Foglalás átlagos értéke');
  expect(page).toContain('Elveszett / inaktív vendégek');
  expect(page).toContain('Befejezett bejegyzések');
  expect(page).toContain('Lemondott bejegyzések');
  expect(page).toContain('Meg nem jelent / no-show');
  expect(page).toContain('Átlagos foglaltság');
  expect(page).toContain('previousPeriod');
});

test('management tools are available from the management sidebar',()=>{
  const sidebar=read('src/components/Sidebar.tsx');
  const top=read('src/pages/VirTopMetricsPage.tsx');
  expect(sidebar).toContain("name:'Vállalat irányítási eszközök'");
  expect(sidebar).toContain('/reports/management-tools?tool=pareto');
  expect(sidebar).toContain('/reports/management-tools?tool=swot');
  expect(sidebar).toContain('/reports/management-tools?tool=root-cause');
  expect(sidebar).toContain('/reports/management-tools?tool=decision-risk');
  expect(top).toContain('window.location.pathname==="/reports/management-tools"');
  expect(top).toContain('<ManagementToolsPage/>');
});

test('management tools route now resolves to the database project workspace',()=>{
  const bridge=read('src/pages/ManagementToolsPage.tsx');
  const page=read('src/pages/ManagementImprovementProjectPage.tsx');
  const client=read('src/api/managementImprovement.ts');
  expect(bridge).toContain("ManagementImprovementProjectPage");
  for(const marker of ['Fejlesztési projektek','Intézkedések / CAPA','Előtte–utána KPI','Jóváhagyás','Audit trail','Pareto','SWOT','Ishikawa / halszálka','5 Miért','FMEA / RPN','PDCA','DMAIC','SIPOC'])expect(page).toContain(marker);
  for(const endpoint of ['/projects','/request-approval','/approve','/reject','/close','/actions','/kpis'])expect(client).toContain(endpoint);
  expect(page).not.toContain('localStorage.setItem');
});
