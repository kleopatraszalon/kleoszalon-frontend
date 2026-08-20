import fs from 'fs';
import path from 'path';

const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

describe('VIR menu route integrity',()=>{
  const app=read('src/App.tsx');
  const calendar=read('src/pages/AppointmentsCalendar.tsx');

  it('routes appointment menu views to their implemented screens',()=>{
    expect(app).toContain('path: "/appointments/list"');
    expect(calendar).toContain('"voice-booking": "/appointments/voice-booking-stats"');
    expect(calendar).toContain('"complex-services": "/modules/appointments/complex-services"');
    expect(calendar).toContain('"group-bookings": "/modules/appointments/group-bookings"');
    expect(calendar).toContain('notifications: "/modules/appointments/notifications"');
    expect(calendar).toContain('"no-show": "/modules/appointments/attendance"');
  });

  it('keeps legacy operational menu links on functional pages',()=>{
    expect(app).toContain('path: "/operations/tasks"');
    expect(app).toContain('to="/extra/tasks"');
    expect(app).toContain('path: "/operations/maintenance"');
    expect(app).toContain('to="/spec/maintenance"');
    expect(app).toContain('path: "/operations/documents"');
    expect(app).toContain('to="/extra/documents"');
    expect(app).toContain('path: "/operations/email"');
    expect(app).toContain('to="/spec/internal-email"');
    expect(app).toContain('path: "/operations/complaints"');
    expect(app).toContain('to="/marketing/complaints"');
  });

  it('wires developed reporting and administration pages instead of report fallbacks',()=>{
    expect(app).toContain('const ManagementToolsPage = lazy');
    expect(app).toContain('path: "/reports/management-tools"');
    expect(app).toContain('path: "/reports/builder"');
    expect(app).toContain('path: "/reports/inventory-movements"');
    expect(app).toContain('path: "/settings/menu-order"');
    expect(app).toContain('path: "/settings/system-health"');
    expect(app).toContain('path: "/settings/uat"');
    expect(app).toContain('path: "/settings/gdpr"');
    expect(app).toContain('path: "/kiosk/admin"');
  });
});
