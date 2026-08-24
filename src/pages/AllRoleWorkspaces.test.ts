import fs from"fs";
import path from"path";
const read=(file:string)=>fs.readFileSync(path.join(process.cwd(),"src",file),"utf8");

test("minden nem admin szerepkor sajat inditopultot kap",()=>{
 const role=read("pages/RoleDashboardPage.tsx");
 expect(role).toContain('<OperationalRoleDashboardPage kind="salon"/>');
 expect(role).toContain('<OperationalRoleDashboardPage kind="manager"/>');
 for(const page of ["AccountingDashboardPage","HrDashboardPage","CustomerDashboardPage","ReceptionDashboardPage","EmployeeDashboardPage"])expect(role).toContain(`<${page}`);
});

test("a szerepkori menuk a napi munkahoz tartozo kozvetlen linkek",()=>{
 const sidebar=read("components/Sidebar.tsx");
 for(const menu of ["STAFF","RECEPTION","LOCATION","MANAGER","HR","ACCOUNTING"])expect(sidebar).toContain(`const ${menu}:MenuItem[]`);
 for(const label of ["Naptár és kapacitás","Munkatársak és beosztás","Legfőbb mutatók","Bér és jutalék","Pénzügyi ellenőrzés"])expect(sidebar).toContain(label);
});

test("az admin inditopult es menu valtozatlanul kulon marad",()=>{
 const role=read("pages/RoleDashboardPage.tsx"),sidebar=read("components/Sidebar.tsx");
 expect(role).toContain("admin&&");
 expect(sidebar).toContain("isAdmin?ADMIN_MENU");
});
