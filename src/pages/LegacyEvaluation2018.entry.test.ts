import fs from 'fs';
import path from 'path';

test('manager task screen exposes employee assignment, approval and 2018 sync', () => {
  const src = fs.readFileSync(path.join(__dirname,'OperationsQualityPage.tsx'),'utf8');
  expect(src).toContain('2018 szinkron');
  expect(src).toContain('Munkatárs kiválasztása');
  expect(src).toMatch(/(?:Vezetői )?Jóváhagyásra vár/);
  expect(src).toContain('automatikus piros X');
  expect(src).toContain('/legacy-2018/reconcile');
});

test('employee mobile app can complete own tasks for manager approval', () => {
  const src = fs.readFileSync(path.join(__dirname,'EmployeeMobileApp.tsx'),'utf8');
  expect(src).toContain('Saját feladatok');
  expect(src).toContain('Elvégeztem');
  expect(src).toContain('/complete');
  expect(src).toContain('vezetői jóváhagyás');
});
