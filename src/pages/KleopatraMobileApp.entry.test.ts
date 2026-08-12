import fs from"fs";import path from"path";
const source=fs.readFileSync(path.join(__dirname,"KleopatraMobileApp.tsx"),"utf8");
test("app has login, registration and guest entry",()=>{expect(source).toContain("Belépés");expect(source).toContain("Regisztráció");expect(source).toContain("Folytatás vendégként");expect(source).toContain("Minden ami szépség, csak Neked!")});
test("registered customer account exposes wallet and passes",()=>{expect(source).toContain("/customer-portal/dashboard");expect(source).toContain("Vendégegyenleg");expect(source).toContain("Aktív bérletek")});
test("admin login and app version notifications are supported",()=>{expect(source).toContain('"customer","admin"');expect(source).toContain("Admin felület");expect(source).toContain("app-version.json");expect(source).toContain("showNotification");expect(source).toContain('APP_VERSION="1.2.0"')});
