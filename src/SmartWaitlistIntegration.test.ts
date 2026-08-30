import fs from 'fs';
import path from 'path';

describe('Smart Waitlist integration', () => {
  const page = fs.readFileSync(path.join(process.cwd(), 'src/pages/AppointmentsModulePage.tsx'), 'utf8');
  const panel = fs.readFileSync(path.join(process.cwd(), 'src/pages/booking/SmartWaitlistPanel.tsx'), 'utf8');

  it('exposes the Smart Waitlist appointments view', () => {
    expect(page).toContain('SmartWaitlistPanel');
    expect(page).toContain('waitlist: { title: "Intelligens várólista"');
    expect(page).toContain('view === "waitlist"');
  });

  it('uses the authenticated Smart Waitlist API and operational actions', () => {
    expect(panel).toContain('/transactions/booking-operations/smart-waitlist');
    expect(panel).toContain('/setup-options');
    expect(panel).toContain('/entries');
    expect(panel).toContain('method: "PATCH"');
    expect(panel).toContain('Ajánlat küldése');
    expect(panel).toContain('Foglalásba emelés');
    expect(panel).toContain('matchable_vacancies');
  });

  it('supports receptionist entry creation, filtering and lifecycle actions', () => {
    expect(panel).toContain('Új várólista-bejegyzés');
    expect(panel).toContain('Minden állapot');
    expect(panel).toContain('Visszavár');
    expect(panel).toContain('Lezárás');
    expect(panel).toContain('/appointments/calendar');
    expect(panel).toContain('/appointments/new');
  });
});
