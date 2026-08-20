import { ADMIN_MENU } from './config/adminMenu';
describe('Booking 4.0 admin menu',()=>{
  it('is visible as a canonical top-level VIR menu group',()=>{
    const group=ADMIN_MENU.find((x)=>x.code==='booking.v4');
    expect(group).toBeTruthy();
    expect(group?.name).toBe('Booking 4.0');
    expect(group?.children.some((x)=>x.route==='/admin/booking-v4'&&x.name.includes('Admin központ'))).toBe(true);
  });
});
