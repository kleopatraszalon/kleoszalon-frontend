import fs from 'fs';
const page=fs.readFileSync('src/pages/VirRevenueLeakagePage.tsx','utf8');const api=fs.readFileSync('src/api/virRevenueLeakage.ts','utf8');const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');const cockpit=fs.readFileSync('src/pages/VirManagerCockpitPage.tsx','utf8');
test('revenue leakage UI exposes evidence based findings',()=>{expect(page).toContain('Revenue Leakage Detector');expect(page).toContain('Becsült kitettség');expect(page).toContain('bizonyíték');expect(page).toContain('COMPLETED_UNPAID')});
test('revenue leakage uses relative governed API',()=>{expect(api).toContain('/vir/p3/revenue-leakage');expect(api).not.toContain('onrender.com')});
test('revenue leakage route is management protected and linked',()=>{expect(routes).toContain('/admin/vir/p3/revenue-leakage');expect(routes).toContain('R(MANAGEMENT, <VirRevenueLeakagePage />)');expect(cockpit).toContain('Revenue Leakage')});
