const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(process.cwd(),file),'utf8');

test('public booking management routes are unauthenticated',()=>{
  const app=read('src/App.tsx');
  assert.match(app,/PublicBookingManagePage/);
  assert.match(app,/path:"\/booking\/manage\/:token",element:<PublicBookingManagePage\/>/);
  assert.match(app,/path:"\/foglalas\/kezeles\/:token",element:<PublicBookingManagePage\/>/);
  assert.doesNotMatch(app,/\/booking\/manage\/:token",element:A\(/);
});

test('public management page loads token summary and schedule-aware availability',()=>{
  const src=read('src/pages/PublicBookingManagePage.tsx');
  assert.match(src,/\/public\/marketing\/booking\/manage\/\$\{encodeURIComponent\(token\)\}/);
  assert.match(src,/exclude_appointment_id:booking\.id/);
  assert.match(src,/service_ids:booking\.service_ids\.join\(","\)/);
  assert.match(src,/\/public\/marketing\/booking\/availability/);
});

test('public management page requires explicit slot confirmation and supports cancellation',()=>{
  const src=read('src/pages/PublicBookingManagePage.tsx');
  assert.match(src,/Módosítás megerősítése/);
  assert.match(src,/\/reschedule/);
  assert.match(src,/Lemondás megerősítése/);
  assert.match(src,/\/cancel/);
  assert.match(src,/Igen, lemondom/);
});
