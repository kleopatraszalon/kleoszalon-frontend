const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(process.cwd(),file),'utf8');

test('API client captures durable voice_event_id from interpret response',()=>{
  const src=read('src/api/api.ts');
  assert.match(src,/VOICE_ORIGIN_KEY/);
  assert.match(src,/response\.data\?\.voice_event_id/);
  assert.match(src,/saveVoiceOrigin\(response\.data\.voice_event_id\)/);
});

test('public booking finalization injects voice origin even after manual UI corrections',()=>{
  const src=read('src/api/api.ts');
  assert.match(src,/isPublicBookingPage\(\)/);
  assert.match(src,/isFinalPublicBookingUrl/);
  assert.match(src,/booking_source:"voice",voice_event_id:origin\.id/);
  assert.match(src,/VOICE_ORIGIN_TTL_MS=30\*60\*1000/);
});

test('voice origin is one-shot and only cleared after successful final public outcome',()=>{
  const src=read('src/api/api.ts');
  assert.match(src,/clearVoiceOrigin\(\)/);
  assert.match(src,/response\.status>=200&&response\.status<300/);
  assert.ok(src.indexOf('saveVoiceOrigin(response.data.voice_event_id)')<src.lastIndexOf('clearVoiceOrigin()'));
});

test('Voice stats UI labels exact conversion and tracking coverage',()=>{
  const src=read('src/pages/BookingVoiceStatsPage.tsx');
  assert.match(src,/voice_booking_conversions/);
  assert.match(src,/conversion_tracking_coverage/);
  assert.match(src,/Pontos Voice konverzió/);
  assert.match(src,/exact_book_conversions/);
  assert.match(src,/historical_uncorrelated_records/);
});

test('recent Voice event table exposes correlated outcome but no transcript field',()=>{
  const src=read('src/pages/BookingVoiceStatsPage.tsx');
  assert.match(src,/converted_to_booking/);
  assert.match(src,/converted_to_waitlist/);
  assert.match(src,/outcomeLabel/);
  assert.doesNotMatch(src,/transcript:/);
});
