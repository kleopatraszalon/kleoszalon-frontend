import fs from 'fs';
import path from 'path';

const read=(file:string)=>fs.readFileSync(path.join(process.cwd(),file),'utf8');

test('System Health embeds the Observability APM panel',()=>{
 const health=read('src/pages/SystemHealthPage.tsx');
 expect(health).toContain("import ObservabilityApmPanel from './ObservabilityApmPanel'");
 expect(health).toContain('<ObservabilityApmPanel/>');
});

test('APM dashboard exposes all required production signals',()=>{
 const panel=read('src/pages/ObservabilityApmPanel.tsx');
 for(const marker of ['API P50','API P95','API P99','HTTP 4XX','HTTP 5XX','DB POOL','slow query','NAV, IMAP, queue-k, scheduler, kassza, settlement, készlet és payroll','Admin értesítési audit'])expect(panel).toContain(marker);
 expect(panel).toContain('/api/transactions/notifications/observability');
 expect(panel).toContain('/history?hours=24');
 expect(panel).toContain('/alerts?limit=50');
 expect(panel).toContain('/deliveries?limit=30');
});

test('APM dashboard auto refreshes and can trigger a managed sample',()=>{
 const panel=read('src/pages/ObservabilityApmPanel.tsx');
 expect(panel).toContain('window.setInterval');
 expect(panel).toContain('60_000');
 expect(panel).toContain("api.post('/api/transactions/notifications/observability/run'");
 expect(panel).toContain('useCallback');
});
