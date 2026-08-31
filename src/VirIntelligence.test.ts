import fs from"fs";import path from"path";
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),"utf8");

test("VIR Intelligence keeps the three live business-health modules inside the unified hub",()=>{const hub=read("src/pages/VirIntelligenceHubPage.tsx"),p=read("src/pages/VirOperationalIntelligencePage.tsx");expect(hub).toContain("VirOperationalIntelligencePage");for(const marker of ["Jövedelmezőség / KPI","Kapacitás + üres időablak","No-show + várólista","Közvetlen munkabér","Várólistával tölthető","No-show kockázati lista"])expect(p).toContain(marker)});

test("VIR Intelligence uses governed API endpoints",()=>{const a=read("src/api/virIntelligence.ts");for(const marker of ["/vir/intelligence/profitability","/vir/intelligence/capacity","/vir/intelligence/no-show","getVirProfitability","getVirCapacity","getVirNoShow"])expect(a).toContain(marker);expect(a).not.toContain("onrender.com")});

test("VIR Intelligence is management protected and connected to the governed workflow",()=>{const r=read("src/routing/adminRoutes.tsx"),c=read("src/pages/VirManagerCockpitPage.tsx"),nav=read("src/pages/VirIntelligenceFlowNav.tsx");expect(r).toContain('{ path: "/admin/vir/intelligence", element: R(MANAGEMENT, <VirIntelligencePage />) }');expect(c).toContain('/admin/vir/intelligence');for(const route of ['/admin/vir/p16','/admin/vir/p18','/admin/vir/p19','/admin/vir/p17'])expect(nav).toContain(route)});

test("profitability UI explains direct-cost scope and canonical calculation without overstating net profit",()=>{const p=read("src/pages/VirOperationalIntelligencePage.tsx");for(const marker of ["Közvetlen fedezet","receptúra szerinti anyag − időarányos munkabér − jutalék","Kanonikus számítás:","profitEngine"])expect(p).toContain(marker)});