import fs from"fs";import path from"path";
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),"utf8");

test("VIR Intelligence exposes the three requested management modules",()=>{const p=read("src/pages/VirIntelligencePage.tsx");for(const marker of ["Jövedelmezőség / KPI","Kapacitás + üres időablak","No-show + várólista","Közvetlen munkabér","Várólistával tölthető","No-show kockázati lista"])expect(p).toContain(marker)});

test("VIR Intelligence uses governed API endpoints",()=>{const a=read("src/api/virIntelligence.ts");for(const marker of ["/vir/intelligence/profitability","/vir/intelligence/capacity","/vir/intelligence/no-show","getVirProfitability","getVirCapacity","getVirNoShow"])expect(a).toContain(marker);expect(a).not.toContain("onrender.com")});

test("VIR Intelligence is management protected and linked from Manager Cockpit",()=>{const r=read("src/routing/adminRoutes.tsx"),c=read("src/pages/VirManagerCockpitPage.tsx");expect(r).toContain('{ path: "/admin/vir/intelligence", element: R(MANAGEMENT, <VirIntelligencePage />) }');expect(c).toContain('/admin/vir/intelligence');expect(c).toContain('VIR Intelligence')});

test("profitability UI explains direct-cost scope without overstating net profit",()=>{const p=read("src/pages/VirIntelligencePage.tsx");for(const marker of ["Közvetlen fedezet","anyag − jutalék − időarányos közvetlen munkabér","Munkáltatói közterhek és általános rezsi még nem részei"])expect(p).toContain(marker)});
