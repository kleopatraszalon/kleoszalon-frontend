const fs=require('fs');
const app=fs.readFileSync('src/App.tsx','utf8');
const sidebar=fs.readFileSync('src/components/Sidebar.tsx','utf8');
const critical=[
  '/appointments/calendar','/workorders','/modules/team/timetable','/modules/team/attendance',
  '/modules/customers/clients','/modules/customers/crm','/employees','/loyalty','/finance',
  '/warehouse','/warehouse/products','/warehouse/central-supply','/masterdata/services',
  '/reports/top-metrics','/knowledge-base/checklists','/webshop/admin','/admin/access-control',
  '/signage','/signage/appearance','/kiosk'
];
const failures=[];
for(const route of critical){
  if(!sidebar.includes(route)) failures.push(`A menüben/fallbackban hiányzik: ${route}`);
  const exact=app.includes(`path:\"${route}\"`);
  const customerDynamic=route.startsWith('/modules/customers/')&&app.includes('path:\"/modules/customers/:view\"');
  if(!exact&&!customerDynamic) failures.push(`A routerben hiányzik: ${route}`);
}
const forbiddenDashboardFallback=/function FallbackRedirect\(\)\{return <Navigate to=\{getToken\(\)\?HOME_PATH/.test(app);
if(forbiddenDashboardFallback) failures.push('Az ismeretlen route még mindig csendben az irányítópultra irányít.');
if(!sidebar.includes("MENU_CACHE_KEY='kleo.menu.cache.v11'")) failures.push('A menü-cache verzió nem v11.');
if(failures.length){console.error('MENÜ ROUTE AUDIT HIBA');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log(`Menü route audit OK: ${critical.length} kritikus útvonal ellenőrizve.`);
