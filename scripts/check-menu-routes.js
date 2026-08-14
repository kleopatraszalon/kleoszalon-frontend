const fs=require('fs');
const app=fs.readFileSync('src/App.tsx','utf8');
const sidebar=fs.readFileSync('src/components/Sidebar.tsx','utf8');
const accountingSidebar=fs.existsSync('src/components/AccountingSidebar.tsx')?fs.readFileSync('src/components/AccountingSidebar.tsx','utf8'):'';
const staticMenus=sidebar+'\n'+accountingSidebar;
const critical=[
  '/appointments/calendar','/workorders','/modules/team/timetable','/modules/team/attendance',
  '/modules/customers/clients','/modules/customers/crm','/employees','/loyalty','/finance',
  '/warehouse','/warehouse/products','/warehouse/operations','/warehouse/lots','/warehouse/central-supply','/masterdata/services',
  '/reports/top-metrics','/knowledge-base/checklists','/webshop/admin','/admin/access-control',
  '/signage','/signage/appearance','/kiosk'
];
const scopedMenuRoutes=[
  '/appointments/calendar','/workorders','/modules/team/timetable','/knowledge-base/checklists',
  '/finance','/warehouse','/warehouse/products','/warehouse/operations','/warehouse/lots'
];
const failures=[];
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const hasRoute=route=>new RegExp(`path\\s*:\\s*["']${escapeRegex(route)}["']`).test(app);
const hasDynamicCustomerRoute=()=>/path\s*:\s*["']\/modules\/customers\/:view["']/.test(app);
for(const route of critical){
  const exact=hasRoute(route);
  const customerDynamic=route.startsWith('/modules/customers/')&&hasDynamicCustomerRoute();
  if(!exact&&!customerDynamic) failures.push(`A routerben hiányzik: ${route}`);
}
for(const route of scopedMenuRoutes)if(!staticMenus.includes(route))failures.push(`A szerepkör-alapú statikus menüben hiányzik: ${route}`);
const forbiddenDashboardFallback=/function\s+FallbackRedirect\s*\(\s*\)\s*\{[\s\S]{0,320}<Navigate\s+to=\{getToken\(\)\?HOME_PATH/.test(app);
if(forbiddenDashboardFallback) failures.push('Az ismeretlen route még mindig csendben az irányítópultra irányít.');
if(!sidebar.includes("MENU_CACHE_KEY='kleo.menu.cache.v13'")) failures.push('A menü-cache verzió nem v13.');
if(failures.length){console.error('MENÜ ROUTE AUDIT HIBA');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log(`Menü route audit OK: ${critical.length} router és ${scopedMenuRoutes.length} statikus szerepkör-menü útvonal ellenőrizve.`);
