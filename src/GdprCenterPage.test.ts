import fs from"fs";import path from"path";
const page=fs.readFileSync(path.join(__dirname,"pages/GdprCenterPage.tsx"),"utf8");
test("GDPR center exposes every required workspace",()=>{for(const x of["Adatkezelések","Megőrzés és törlés","Érintetti kérelmek","Incidensek","Adatfeldolgozók","Beállítások","Mit kell tudni?"])expect(page).toContain(x)});
test("GDPR center calls operational API and keeps retention safe",()=>{expect(page).toContain('/transactions/gdpr');expect(page).toContain('A szabály biztonsági okból kikapcsolva jön létre');expect(page).toContain('72 órás határidő')});
test("rights and incident transitions collect mandatory evidence",()=>{for(const x of["Hosszabbítás indoka","Érintett tájékoztatásának bizonyítéka","Teljesítés bizonyítéka","Hatósági ügyiratszám","72 órán túli bejelentés indoka"])expect(page).toContain(x)});
