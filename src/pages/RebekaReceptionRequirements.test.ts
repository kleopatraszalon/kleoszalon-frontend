import fs from "fs";
import path from "path";

const read=(file:string)=>fs.readFileSync(path.join(process.cwd(),"src",file),"utf8");

test("a recepcios menu a napi munkafolyamatot koveti",()=>{
 const sidebar=read("components/Sidebar.tsx");
 expect(sidebar).toContain("const RECEPTION:MenuItem[]");
 ["Naptár","Új időpont","Vendégek","Munkalap / elszámolás","Új értékesítés","Pénztár","Ellenőrzőlisták"].forEach(label=>expect(sidebar).toContain(label));
 expect(sidebar).toContain("isReceptionist?RECEPTION");
});

test("a reszlegnezet tenyleges reszlegek szerint csoportosit",()=>{
 const calendar=read("pages/AppointmentsCalendarCore.tsx");
 expect(calendar).toContain("new Set<string>(appointments.map(appointmentDepartment))");
 expect(calendar).toContain('appointmentDepartment(item) === column.serviceKey');
});

test("a recepcios kezdooldal nem duplikalja a teljes menut",()=>{
 const dashboard=read("pages/ReceptionDashboardPage.tsx");
 expect(dashboard).not.toContain('reception-home__shortcuts');
 expect(dashboard).toContain("<DashboardChecklistCard/>");
});
