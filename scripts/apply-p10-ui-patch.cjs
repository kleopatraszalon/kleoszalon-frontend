const fs=require('fs');
function patch(p,fn){const s=fs.readFileSync(p,'utf8');const n=fn(s);if(n===s)throw new Error('No patch '+p);fs.writeFileSync(p,n)}
patch('src/routing/routePages.ts',s=>s.replace('export const VirP9Page = lazy(() => import("../pages/VirP9Page"));','export const VirP9Page = lazy(() => import("../pages/VirP9Page"));\nexport const VirP10Page = lazy(() => import("../pages/VirP10Page"));'));
patch('src/routing/adminRoutes.tsx',s=>s.replace('  VirP9Page,','  VirP9Page,\n  VirP10Page,').replace('  { path: "/admin/vir/p9", element: R(MANAGEMENT, <VirP9Page />) },','  { path: "/admin/vir/p9", element: R(MANAGEMENT, <VirP9Page />) },\n  { path: "/admin/vir/p10", element: R(MANAGEMENT, <VirP10Page />) },'));
patch('src/pages/VirManagerCockpitPage.tsx',s=>s.replace('<button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p9")}>Marketing automatizálás P9</button>','<button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p9")}>Marketing automatizálás P9</button>\n      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p10")}>Revenue Autopilot P10</button>'));
patch('scripts/check-menu-routes.js',s=>s.replace('routeMatches.length!==194','routeMatches.length!==195').replace('várt 194','várt 195'));
fs.rmSync('scripts/apply-p10-ui-patch.cjs');fs.rmSync('.github/workflows/p10-ui-one-shot.yml');
