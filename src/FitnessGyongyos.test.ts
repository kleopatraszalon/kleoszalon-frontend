import fs from 'node:fs';
import path from 'node:path';

describe('Gyöngyös Fitness wiring',()=>{
  const sidebar=fs.readFileSync(path.join(__dirname,'components/Sidebar.tsx'),'utf8');
  const reception=fs.readFileSync(path.join(__dirname,'pages/ReceptionDashboardPage.tsx'),'utf8');
  const finance=fs.readFileSync(path.join(__dirname,'pages/Penzugy.tsx'),'utf8');
  const page=fs.readFileSync(path.join(__dirname,'pages/FitnessPage.tsx'),'utf8');

  test('location users see Fitness only after backend access decision',()=>{
    expect(sidebar).toContain("const FITNESS_GYONGYOS");
    expect(sidebar).toContain("route:'/finance/fitness'");
    expect(sidebar).toContain('...(fitnessAllowed?[FITNESS_GYONGYOS]:[])');
    expect(sidebar).toContain('RECEIPT_COMPLIANCE');
    expect(sidebar).toContain('/vir/fitness/access');
  });

  test('reception dashboard stays focused on the daily workflow',()=>{
    expect(reception).not.toContain("fetch(withBase('vir/fitness/access')");
    expect(reception).not.toContain('fitnessAllowed&&');
    expect(reception).not.toContain("navigate('/finance/fitness')");
  });

  test('finance route hosts the isolated Fitness workspace',()=>{
    expect(finance).toContain('import FitnessPage');
    expect(finance).toContain('pathname === "/finance/fitness"');
    expect(finance).toContain('<FitnessPage />');
  });

  test('workspace exposes requested operational domains and OTIC token controls',()=>{
    for(const text of ['Bérletek','0–24 / OTIC','Fitnessz termékek','Akciók','Kondigépek','OTIC helyi bridge']) expect(page).toContain(text);
    expect(page).toContain('/vir/fitness/settings/bridge-token');
    expect(page).toContain(['/vir/fitness/equipment/','$','{maintenance.equipment_id}/maintenance'].join(''));
    expect(page).toContain(['/vir/fitness/memberships/','$','{cardFor.id}/card'].join(''));
  });
});
