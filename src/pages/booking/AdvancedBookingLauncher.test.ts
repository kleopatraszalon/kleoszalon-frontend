import fs from"fs";import path from"path";
const read=(name:string)=>fs.readFileSync(path.join(__dirname,name),"utf8");
const launcher=read("AdvancedBookingLauncher.tsx");
const css=read("AdvancedBookingLauncher.css");
const wrapper=fs.readFileSync(path.join(__dirname,"..","AppointmentsCalendar.tsx"),"utf8");
const core=fs.readFileSync(path.join(__dirname,"..","AppointmentsCalendarCore.tsx"),"utf8");

test("keeps the existing calendar and mounts advanced booking as an additive layer",()=>{expect(wrapper).toContain("AppointmentsCalendarCore");expect(wrapper).toContain("AdvancedBookingLauncher");expect(core).toContain("BookingOperationsPanel");expect(core).toContain("AppointmentNewModal");expect(core).toContain("FullCalendar")});

test("exposes sequential and parallel 4Hands service-to-staff assignment",()=>{expect(launcher).toContain("Szekvenciális");expect(launcher).toContain("4Hands / párhuzamos");expect(launcher).toContain("employee_id");expect(launcher).toContain("service_id");expect(launcher).toContain("/availability");expect(launcher).toContain("/appointments")});

test("supports salon resource instances and service requirements",()=>{expect(launcher).toContain("/resources");expect(launcher).toContain("/service-resources/");expect(launcher).toContain("resource_group");expect(launcher).toContain("Automatikus kiosztás");expect(launcher).toContain("Erőforrásigény mentése")});

test("resource administration is hidden from non managers in UI",()=>{expect(launcher).toContain("MANAGERS");expect(launcher).toContain("canManage");expect(launcher).toContain('tab==="resources"')});

test("uses Kleopatra brand palette in the advanced surface",()=>{for(const color of ["#120c08","#b69861","#d5c4a4","#e3d8c3","#ec008c"])expect(css.toLowerCase()).toContain(color)});
