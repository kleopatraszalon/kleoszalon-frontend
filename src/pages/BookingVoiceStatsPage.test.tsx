import fs from "fs";
import path from "path";

describe("BookingVoiceStatsPage stage1e contract",()=>{
  const read=(file:string)=>fs.readFileSync(path.join(process.cwd(),file),"utf8");
  test("management route exists before appointments wildcard",()=>{
    const app=read("src/App.tsx");
    const route=app.indexOf('/appointments/voice-booking-stats');
    const wildcard=app.indexOf('/appointments/*');
    expect(route).toBeGreaterThanOrEqual(0);
    expect(wildcard).toBeGreaterThan(route);
    expect(app).toMatch(/R\s*\(\s*MANAGEMENT\s*,\s*<BookingVoiceStatsPage\s*\/>\s*\)/);
  });
  test("page exposes voice analytics, AI, locations and privacy-safe recent events",()=>{
    const page=read("src/pages/BookingVoiceStatsPage.tsx");
    expect(page).toContain('/transactions/booking-voice-stats');
    expect(page).toContain('recognition_rate');
    expect(page).toContain('conversion_rate');
    expect(page).toContain('voice_booking_share');
    expect(page).toContain('estimated_cost_usd');
    expect(page).toContain('top_services');
    expect(page).toContain('recent_transcripts_exposed');
  });
});
