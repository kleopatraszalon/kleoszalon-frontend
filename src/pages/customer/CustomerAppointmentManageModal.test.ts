import fs from 'fs';
import path from 'path';

test('customer reschedule availability excludes the appointment being moved', () => {
  const source=fs.readFileSync(path.join(__dirname,'CustomerAppointmentManageModal.tsx'),'utf8');
  expect(source).toContain('exclude_appointment_id:appointment.id');
  expect(source).toContain('/public/marketing/booking/availability');
  expect(source).toContain('/customer-portal/self-service/appointments/${appointment.id}/reschedule');
});
