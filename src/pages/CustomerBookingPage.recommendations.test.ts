import fs from"fs";import path from"path";
const wrapper=fs.readFileSync(path.join(__dirname,"CustomerBookingPage.tsx"),"utf8");
const source=fs.readFileSync(path.join(__dirname,"booking/BookingExperiencePage.tsx"),"utf8");
test("registered booking uses the shared final experience",()=>{expect(wrapper).toContain('BookingExperiencePage mode="customer"')});
test("registered booking offers non-blocking related services and promotions",()=>{expect(source).toContain("/public/marketing/booking/recommendations");expect(source).toContain("AJÁNLÁS");expect(source).toContain("addRecommendation");expect(source).toContain("Hozzáadás");expect(source).toContain('.catch(()=>active&&setRecommendations([]))')});
