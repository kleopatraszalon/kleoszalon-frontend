import fs from 'fs';
import path from 'path';

test('WallBoard exposes AI-supported automatic daily action selection', () => {
  const src = fs.readFileSync(path.join(__dirname, 'WallBoardDailyActionPage.tsx'), 'utf8');
  expect(src).toContain('AI-támogatott automatikus napi akció');
  expect(src).toContain('Napi akciózásban szerepel');
  expect(src).toContain('/auto-selector');
  expect(src).toContain('/recommendation');
  expect(src).toContain('/create-draft');
  expect(src).toContain('/eligibility');
  expect(src).toContain('28 napos');
});

test('AI recommendation remains human-approved before publishing', () => {
  const src = fs.readFileSync(path.join(__dirname, 'WallBoardDailyActionPage.tsx'), 'utf8');
  expect(src).toContain('AI piszkozat létrehozása');
  expect(src).toContain('A végső kedvezmény, szöveg és publikálás vezetői döntés');
  expect(src).toContain('Mentés és publikálás');
});
