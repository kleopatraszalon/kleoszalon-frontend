import fs from"fs";import path from"path";
const wrapper=fs.readFileSync(path.join(__dirname,"PublicBookingPage.tsx"),"utf8");
const source=fs.readFileSync(path.join(__dirname,"booking/BookingExperiencePage.tsx"),"utf8");
test("public booking uses the shared final experience",()=>{expect(wrapper).toContain('BookingExperiencePage mode="public"')});
test("loads safe booking recommendations after service selection",()=>{expect(source).toContain('/public/marketing/booking/recommendations');expect(source).toContain('AJÁNLÁS');expect(source).toContain('Hozzáadás')});
test("recommendation loading never blocks booking availability",()=>{expect(source).toContain('.catch(()=>active&&setRecommendations([]))');expect(source).toContain('loadAvailability')});
