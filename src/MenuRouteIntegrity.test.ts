import fs from 'fs';
import path from 'path';

const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');
const routeFiles=[
  'src/routing/publicRoutes.tsx',
  'src/routing/bookingRoutes.tsx',
  'src/routing/hrRoutes.tsx',
  'src/routing/financeRoutes.tsx',
  'src/routing/inventoryRoutes.tsx',
  'src/routing/adminRoutes.tsx',
];

describe('VIR menu route integrity',()=>{
  const routes=routeFiles.map(read).join('\n');
  const pages=read('src/routing/routePages.ts');
  const calendar=read('src/pages/AppointmentsCalendar.tsx');
  const smartWaitlist=read('src/pages/booking/SmartWaitlistPanel.tsx');

  it('routes appointment menu views to their implemented screens',()=>{
    expect(routes).toContain('path: "/appointments/list"');
    expect(calendar).toContain('"voice-booking": "/appointments/voice-booking-stats"');
    expect(calendar).toContain('"complex-services": "/modules/appointments/complex-services"');
    expect(calendar).toContain('"group-bookings": "/modules/appointments/group-bookings"');
    expect(calendar).toContain('notifications: "/modules/appointments/notifications"');
    expect(calendar).toContain('"no-show": "/modules/appointments/attendance"');
    expect(calendar).toContain('waitlist: "/modules/appointments/waitlist"');
    expect(smartWaitlist).toContain('/transactions/booking-operations/smart-waitlist');
    expect(smartWaitlist).toContain('Smart Waitlist');
    expect(smartWaitlist).toContain('Új várólista-bejegyzés');
  });

  it('keeps legacy operational menu links on functional pages',()=>{
    expect(routes).toContain('path: "/operations/tasks"');
    expect(routes).toContain('to="/extra/tasks"');
    expect(routes).toContain('path: "/operations/maintenance"');
    expect(routes).toContain('to="/spec/maintenance"');
    expect(routes).toContain('path: "/operations/documents"');
    expect(routes).toContain('to="/extra/documents"');
    expect(routes).toContain('path: "/operations/email"');
    expect(routes).toContain('to="/spec/internal-email"');
    expect(routes).toContain('path: "/operations/complaints"');
    expect(routes).toContain('to="/marketing/complaints"');
  });

  it('wires developed reporting and administration pages instead of report fallbacks',()=>{
    expect(pages).toContain('export const ManagementToolsPage = lazy');
    expect(routes).toContain('path: "/reports/management-tools"');
    expect(routes).toContain('path: "/reports/builder"');
    expect(routes).toContain('path: "/reports/inventory-movements"');
    expect(routes).toContain('path: "/settings/menu-order"');
    expect(routes).toContain('path: "/settings/system-health"');
    expect(routes).toContain('path: "/settings/uat"');
    expect(routes).toContain('path: "/settings/gdpr"');
    expect(routes).toContain('path: "/kiosk/admin"');
  });
});
