import fs from"fs";import path from"path";
const source=fs.readFileSync(path.join(__dirname,"KleopatraMobileApp.tsx"),"utf8");
test("app has login, registration and guest entry",()=>{expect(source).toContain("Belépés");expect(source).toContain("Regisztráció");expect(source).toContain("Folytatás vendégként");expect(source).toContain("Minden ami szépség, csak Neked!")});
test("registered customer account exposes wallet and passes",()=>{expect(source).toContain("/customer-portal/dashboard");expect(source).toContain("Vendégegyenleg");expect(source).toContain("Aktív bérletek")});
