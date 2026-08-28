const fs=require('fs');
const path=require('path');
const app=fs.readFileSync('src/App.tsx','utf8');
const routeAccess=fs.readFileSync('src/routing/routeAccess.tsx','utf8');
const sidebar=fs.readFileSync('src/components/Sidebar.tsx','utf8');
const accountingSidebar=fs.existsSync('src/components/AccountingSidebar.tsx')?fs.readFileSync('src/components/AccountingSidebar.tsx','utf8'):'';
const staticMenus=sidebar+'\n'+accountingSidebar;
const critical=[
  '/appointments/calendar','/workorders','/modules/team/timetable','/modules/team/attendance',
  '/modules/customers/clients','/modules/customers/crm','/employees','/loyalty','/finance',
  '/warehouse','/warehouse/products','/warehouse/operations','/warehouse/lots','/warehouse/central-supply','/masterdata/services',
  '/reports/top-metrics','/knowledge-base/checklists','/webshop/admin','/admin/access-control',
  '/signage','/signage/appearance','/kiosk','/hr/positions'
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

// Every static React Router path must have exactly one owner. Duplicate route
// declarations are maintenance hazards because one page can silently shadow or
// disagree with another implementation while both appear valid in code review.
const routeMatches=[...app.matchAll(/\bpath\s*:\s*["']([^"']+)["']/g)].map(match=>match[1]);
const routeCounts=new Map();
for(const route of routeMatches)routeCounts.set(route,(routeCounts.get(route)||0)+1);
for(const [route,count] of routeCounts)if(count>1)failures.push(`Duplikált router útvonal (${count}x): ${route}`);

if(!app.includes('from "./routing/routeAccess"')) failures.push('Az App.tsx nem a központi routing/routeAccess guard réteget használja.');
if(/function\s+RequireAuth\s*\(/.test(app)||/function\s+RequireRoles\s*\(/.test(app)) failures.push('Auth/role guard implementáció került vissza az App.tsx-be; használd a routing/routeAccess modult.');
if(!/export\s+function\s+RequireAuth/.test(routeAccess)||!/export\s+function\s+RequireRoles/.test(routeAccess)) failures.push('A központi routeAccess modulból hiányzik az auth vagy role guard.');
if(!/ADMIN_ROLES/.test(routeAccess)||!/MANAGEMENT_ROLES/.test(routeAccess)||!/KIOSK_MANAGER_ROLES/.test(routeAccess)) failures.push('A route szerepkör-csoportok nincsenek központilag definiálva.');

// Source-changing workflows must never bypass PR review by committing directly
// to main. Deployment workflows may deploy main, but they must not mutate code.
const workflowDir='.github/workflows';
if(fs.existsSync(workflowDir)){
  for(const name of fs.readdirSync(workflowDir).filter(file=>/\.ya?ml$/i.test(file))){
    const workflow=fs.readFileSync(path.join(workflowDir,name),'utf8');
    const writesContents=/contents\s*:\s*write/i.test(workflow);
    const pushesMain=/git\s+push[^\n]*(?:HEAD:main|origin\s+main|refs\/heads\/main)/i.test(workflow);
    if(writesContents&&pushesMain) failures.push(`Közvetlen main-forrásmódosító workflow tiltott: ${name}`);
  }
}

const forbiddenDashboardFallback=/function\s+FallbackRedirect\s*\(\s*\)\s*\{[\s\S]{0,320}<Navigate\s+to=\{getToken\(\)\?HOME_PATH/.test(app);
if(forbiddenDashboardFallback) failures.push('Az ismeretlen route még mindig csendben az irányítópultra irányít.');
if(!/MENU_CACHE_KEY='kleo\.menu\.cache\.v\d+'/.test(sidebar)) failures.push('A menü-cache kulcs nincs verziózva.');

if(failures.length){
  console.error('MENÜ / ROUTING ARCHITEKTÚRA AUDIT HIBA');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Routing audit OK: ${routeMatches.length} egyedi route, ${critical.length} kritikus router és ${scopedMenuRoutes.length} statikus szerepkör-menü útvonal ellenőrizve.`);
