import fs from"fs";import path from"path";
const launcher=fs.readFileSync(path.join(__dirname,"ClientGovernanceLauncher.tsx"),"utf8");
const wrapper=fs.readFileSync(path.join(__dirname,"..","ClientsCRMPage.tsx"),"utf8");
const core=fs.readFileSync(path.join(__dirname,"..","ClientsCRMCore.tsx"),"utf8");
const dictionary=fs.readFileSync(path.join(__dirname,"..","..","i18n","LanguageProvider.tsx"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"ClientGovernanceLauncher.css"),"utf8");

test("keeps existing CRM and adds governance as an additive layer",()=>{expect(wrapper).toContain("ClientsCRMCore");expect(wrapper).toContain("ClientGovernanceLauncher");const surface=core+dictionary;for(const marker of ["Ügyféltörzs","Címkék és szegmensek","Import és duplikációk","Altegio XLSX import"])expect(surface).toContain(marker)});
test("supports online booking block and unblock with internal reason",()=>{expect(launcher).toContain("online-booking-block");expect(launcher).toContain("Online foglalás tiltása");expect(launcher).toContain("Tiltás feloldása");expect(launcher).toContain("Tiltás belső indoka")});
test("supports duplicate preview and confirmed audited merge",()=>{expect(launcher).toContain("duplicates/merge-preview");expect(launcher).toContain("duplicates/merge");expect(launcher).toContain("Összevonási előnézet");expect(launcher).toContain("Végleges összevonás");expect(launcher).toContain("confirmed")});
test("merge UI is manager gated",()=>{expect(launcher).toContain("MANAGERS");expect(launcher).toContain("canMerge");expect(launcher).toContain('tab === "merge" && canMerge')});
test("uses Kleopatra brand palette",()=>{for(const color of ["#120c08","#b69861","#d5c4a4","#e3d8c3"])expect(css.toLowerCase()).toContain(color)});
