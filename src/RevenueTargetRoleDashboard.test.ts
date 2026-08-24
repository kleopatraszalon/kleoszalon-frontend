import fs from"node:fs";
import path from"node:path";

const read=(file:string)=>fs.readFileSync(path.join(__dirname,file),"utf8");

test("daily revenue plan uses scheduled net work time and position targets",()=>{
 const daily=read("pages/dashboard/DashboardDailyOperations.tsx");
 const operations=read("pages/booking/BookingOperationsPanel.tsx");
 const positions=read("pages/HrPositionsPage.tsx");
 expect(daily).toContain('/vir-targets/daily-plan');
 expect(daily).toContain('daily_revenue_target');
 expect(operations).toContain('munkaórákból számolt terv');
 expect(positions).toContain('revenue_target_per_hour');
 expect(positions).toContain('Elvárt bevétel / nettó munkaóra');
});

test("non-admin management role receives a dedicated compact workspace",()=>{
 const role=read("pages/RoleDashboardPage.tsx");
 const manager=read("pages/ManagerDashboardPage.tsx");
 const reception=read("pages/ReceptionDashboardPage.tsx");
 expect(role).toContain('if(manager)return');
 expect(role).toContain('<ManagerDashboardPage/>');
 expect(manager).toContain('<DashboardDailyOperations compact/>');
 expect(reception).toContain('<DashboardDailyOperations compact/>');
 expect(reception).not.toContain('<ReceptionDeviceControlPanel/>');
});
