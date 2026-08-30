import fs from 'node:fs';
import{describe,it,expect}from'vitest';
describe('VIR P6 autonomous revenue guest experience',()=>{
 it('wires protected P6 workspace and requested modules',()=>{
  const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');const pages=fs.readFileSync('src/routing/routePages.ts','utf8');const api=fs.readFileSync('src/api/virP6.ts','utf8');const page=fs.readFileSync('src/pages/VirP6Page.tsx','utf8');
  expect(routes).toContain('/admin/vir/p6');expect(routes).toContain('R(MANAGEMENT, <VirP6Page />)');expect(pages).toContain('VirP6Page');for(const endpoint of ['/vir/p6/ai-receptionist/preview','/vir/p6/intelligent-scheduling','/vir/p6/booking-recovery','/vir/p6/agent-gateway/capabilities','/vir/p6/external-competitor-intelligence','/vir/p6/consultation/preview'])expect(api).toContain(endpoint);for(const label of ['AI Receptionist','Intelligent Scheduling 2.0','Booking Recovery Engine','AI-native Booking Gateway','External Competitor Intelligence 2.0','AI Consultation / Beauty Visualizer','AI-recepciós'])expect(page).toContain(label);expect(page).toContain('automatic booking write is disabled');expect(page).toContain('Automatic schedule writes are disabled');expect(page).toContain('Automatic outreach and rebooking are disabled');expect(page).toContain('Külső adatkapcsolat');
 });
});
