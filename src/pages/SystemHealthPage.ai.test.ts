import fs from 'fs';
const source=fs.readFileSync('src/pages/SystemHealthPage.tsx','utf8');
test('system health exposes AI analysis and explicit safe repair',()=>{expect(source).toContain('/system-health/ai-analysis');expect(source).toContain('/system-health/repair');expect(source).toContain('Biztonságos javítás futtatása')});
test('UI explains human approval and deterministic fallback',()=>{expect(source).toContain('SZABÁLYALAPÚ DIAGNÓZIS');expect(source).toContain('az Ön kattintása után')});
