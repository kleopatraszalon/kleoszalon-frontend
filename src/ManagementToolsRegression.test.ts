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

test('continuous improvement workbench includes the requested analysis families',()=>{
  const page=read('src/pages/ManagementToolsPage.tsx');
  for(const marker of ['Pareto','SWOT','Ishikawa / halszálka','5 Miért','FMEA / RPN','PDCA','DMAIC','SIPOC','Affinitásdiagram','Fa-diagram','Kapcsolati térkép','Prioritási mátrix','Döntési mátrix','Ellenőrzőlap','Hisztogram','Szórásdiagram','PDPC','Aktivitási háló']){
    expect(page).toContain(marker);
  }
  expect(page).toContain('/transactions/operations-quality/overview');
  expect(page).toContain('/employees');
  expect(page).toContain('getVirRevenueSeries');
  expect(page).toContain('localStorage.setItem(STORE');
});
