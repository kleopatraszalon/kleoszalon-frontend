import fs from 'fs';
import path from 'path';

const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

describe('VIR menu route integrity',()=>{
  const app=read('src/App.tsx');
  const calendar=read('src/pages/AppointmentsCalendar.tsx');
  const waitlist=read('src/pages/BookingWaitlistPage.tsx');
  const adminMenu=read('src/config/adminMenu.ts');

  it('routes appointment menu views to their implemented screens',()=>{
    expect(app).toContain('path: "/appointments/list"');
    expect(calendar).toContain('"voice-booking": "/appointments/voice-booking-stats"');
    expect(calendar).toContain('"complex-services": "/modules/appointments/complex-services"');
    expect(calendar).toContain('"group-bookings": "/modules/appointments/group-bookings"');
    expect(calendar).toContain('notifications: "/modules/appointments/notifications"');
    expect(calendar).toContain('"no-show": "/modules/appointments/attendance"');
    expect(calendar).toContain('if(view==="waitlist") return <BookingWaitlistPage/>');
    expect(waitlist).toContain('/transactions/booking-operations/waitlist');
    expect(waitlist).toContain('Intelligens várólista');
    expect(adminMenu).toContain("'Online időpontfoglalás','/modules/appointments/online-booking'");
    expect(adminMenu).toContain("'Időpontok listája','/modules/appointments/list'");
    expect(adminMenu).toContain("'Voice Booking statisztika','/appointments/voice-booking-stats'");
    expect(adminMenu).toContain("'Komplex szolgáltatások (4+ kéz)','/modules/appointments/complex-services'");
    expect(adminMenu).toContain("'Csoportos foglalások és események','/modules/appointments/group-bookings'");
    expect(adminMenu).toContain("'Foglalási értesítések','/modules/appointments/notifications'");
    expect(adminMenu).toContain("'Lemondások és meg nem jelenések','/modules/appointments/attendance'");
  });

  it('uses canonical operational and HR menu links',()=>{
    expect(adminMenu).toContain("'Teendők és jóváhagyások','/extra/tasks'");
    expect(adminMenu).toContain("'Karbantartások és szervizek','/spec/maintenance'");
    expect(adminMenu).toContain("'Elektronikus dokumentumtár','/extra/documents'");
    expect(adminMenu).toContain("'Belső e-mail','/spec/internal-email'");
    expect(adminMenu).toContain("'Panaszkezelés','/marketing/complaints'");
    expect(adminMenu).toContain("'Szerepkörök és jogosultságok','/modules/team/roles'");
    expect(adminMenu).toContain("'Munkatárs-import és duplikációkezelés','/modules/team/import'");
    expect(adminMenu).toContain("'Toborzás és jelentkezések','/hr/applications'");
    expect(adminMenu).toContain("'Képzések és képesítések','/spec/training'");
    expect(adminMenu).toContain("'Munkatársi értékelések','/hr/evaluations'");
  });

  it('uses canonical reporting, masterdata and administration destinations',()=>{
    expect(app).toContain('const ManagementToolsPage = lazy');
    expect(app).toContain('path: "/reports/management-tools"');
    expect(app).toContain('path: "/reports/builder"');
    expect(adminMenu).toContain("'Készletmozgás-kimutatás','/reports/inventory-movement'");
    expect(adminMenu).toContain("'Termékbesorolás ellenőrzése','/masterdata/products/taxonomy-review'");
    expect(adminMenu).toContain("'Eszközök','/masterdata/assets'");
    expect(adminMenu).toContain("'Készletmozgás-típusok','/masterdata/movement-types'");
    expect(adminMenu).toContain("'Kijelző kinézet','/signage/appearance'");
    expect(adminMenu).toContain("'Menürendezés','/admin/menu-layout'");
    expect(adminMenu).toContain("'Rendszerállapot','/admin/system-health'");
    expect(adminMenu).toContain("'Átvételi tesztközpont (UAT)','/admin/uat'");
    expect(adminMenu).toContain("'GDPR-központ','/admin/gdpr'");
    expect(adminMenu).toContain("'VIR megfelelőségi ellenőrzés','/admin/system-health'");
    expect(adminMenu).toContain("'Release Control Center','/admin/system-health'");
  });
});
