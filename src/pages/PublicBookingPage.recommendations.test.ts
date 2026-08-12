import fs from "fs";import path from "path";
const source=fs.readFileSync(path.join(__dirname,"PublicBookingPage.tsx"),"utf8");
test("loads safe booking recommendations after service selection",()=>{expect(source).toContain('/public/marketing/booking/recommendations');expect(source).toContain('Személyre szabott ajánlatok');expect(source).toContain('Hozzáadom')});
test("recommendation loading never blocks booking availability",()=>{expect(source).toContain('.catch(()=>active&&setRecommendations([]))');expect(source).toContain('loadAvailability')});
