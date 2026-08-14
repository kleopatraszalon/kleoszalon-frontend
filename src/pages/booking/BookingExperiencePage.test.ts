import fs from"fs";import path from"path";
const source=fs.readFileSync(path.join(__dirname,"BookingExperiencePage.tsx"),"utf8");

test("final booking UX uses explicit five-step review flow",()=>{
 expect(source).toContain('label:"Szalon"');
 expect(source).toContain('label:"Szolgáltatás"');
 expect(source).toContain('label:"Szakember"');
 expect(source).toContain('label:"Dátum"');
 expect(source).toContain('label:"Időpont"');
 expect(source).toContain("Ellenőrizd a foglalást");
 expect(source).toContain("Végleges foglalás");
});

test("booking draft is resumable without persisting guest PII",()=>{
 expect(source).toContain('const DRAFT_KEY="kleo.booking.draft.v3"');
 expect(source).toContain('sessionStorage.setItem(DRAFT_KEY');
 const draftWrite=source.match(/sessionStorage\.setItem\(DRAFT_KEY,[^\n]+/)?.[0]||"";
 expect(draftWrite).toContain("location_id");
 expect(draftWrite).toContain("service_ids");
 expect(draftWrite).not.toContain("phone");
 expect(draftWrite).not.toContain("email");
 expect(draftWrite).not.toContain("full_name");
});

test("availability UX supports day parts, next-free search and waitlist",()=>{
 expect(source).toContain('type DayPart="all"|"morning"|"afternoon"|"evening"');
 expect(source).toContain("Következő szabad idő");
 expect(source).toContain("Várólistára kérem");
 expect(source).toContain('/public/marketing/booking/waitlist');
});

test("booking never silently overwrites a taken slot",()=>{
 expect(source).toContain('Number(e?.response?.status)===409');
 expect(source).toContain("Ezt az időpontot közben lefoglalták");
 expect(source).toContain("await loadAvailability()");
});

test("voice input remains assisted and still requires explicit final confirmation",()=>{
 expect(source).toContain('/public/marketing/booking/voice/interpret');
 expect(source).toContain("hang alapján nem törlünk");
 expect(source).toContain('if(!confirmOpen||!selectedSlot');
});
