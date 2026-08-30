import type { ReactNode } from "react";
import "../pages/VirManagement.css";

export type GuideKey = "cockpit" | "actions" | "p0" | "p1" | "p2" | "p3" | "revenue-leakage" | "p4" | "p5" | "p6" | "p7" | "p8" | "p9" | "p10" | "p11" | "p12" | "p13" | "p14" | "p15" | "p16";
type GuideDefinition = { title: string; purpose: string; features: string[] };

export const VIR_HUNGARIAN_GUIDES: Record<GuideKey, GuideDefinition> = {
  cockpit:{title:"VIR · Vezetői irányítópult",purpose:"A napi üzleti állapotot, a fő kockázatokat és a vezetői teendőket egyetlen képernyőn mutatja. Arra jó, hogy gyorsan lásd, hol kell még ma beavatkozni.",features:["Napi KPI-k","Kritikus teendők","Vezetői prioritások"]},
  actions:{title:"VIR · Egységes akcióközpont",purpose:"A VIR által jelzett teendőket prioritás, határidő és felelős szerint gyűjti össze. Arra jó, hogy egyetlen felületen lehessen követni, mi nyitott, mi késik és mi vár jóváhagyásra.",features:["Teendők","Határidők","Jóváhagyások"]},
  p0:{title:"VIR P0 · Alap üzleti intelligencia",purpose:"A profitabilitást, kapacitáskihasználást, naptári réseket, no-show kockázatot és várólistás lehetőségeket elemzi. Arra jó, hogy a napi működésből gyorsan több bevételt és jobb kihasználtságot lehessen kihozni.",features:["Jövedelmezőség","Kapacitásoptimalizálás","No-show és várólista"]},
  p1:{title:"VIR P1 · Üzleti intelligencia",purpose:"Az ügyfélértéket, a 7/30/90 napos várható teljesítményt, a készlet- és kompetenciakockázatokat, valamint a vezetői szimulációkat mutatja. Arra jó, hogy előre lásd, hol várható üzleti probléma vagy növekedési lehetőség.",features:["Ügyfél 360°","7/30/90 napos előrejelzés","Intelligens készlet","Kompetenciamátrix","Üzleti szimulátor"]},
  p2:{title:"VIR P2 · Mesterséges intelligencia és eltérésfigyelés",purpose:"AI-alapú vezetői kérdezést, anomáliafelismerést, automatikus összefoglalókat és szalonok közötti összehasonlítást ad. Arra jó, hogy a szokatlan eltérések és fontos vezetői jelzések ne maradjanak észrevétlenül.",features:["VIR AI-segéd","Anomáliák","Vezetői összefoglalók","Szalon-összehasonlítás"]},
  p3:{title:"VIR P3 · Bevétel- és vendégmegtartási intelligencia",purpose:"A lemorzsolódó vendégeket, a következő várható látogatást, az árjavaslatokat és a tagsági potenciált elemzi. Arra jó, hogy több vendéget tarts meg és növeld az egy vendégre jutó bevételt.",features:["Lemorzsolódási radar","Következő látogatás","Intelligens árképzés","Tagsági lehetőségek"]},
  "revenue-leakage":{title:"VIR · Bevételszivárgás-figyelő",purpose:"Megkeresi azokat a pontokat, ahol a lefoglalt vagy elvégzett szolgáltatásból kevesebb bevétel realizálódik a vártnál. Arra jó, hogy azonosítsd és megszüntesd a rejtett bevételveszteségeket.",features:["Eltérések","Elvesző bevétel","Javítási lehetőségek"]},
  p4:{title:"VIR P4 · Működési intelligencia",purpose:"A munkaerőt, műszakokat, munkatársi bevételt, szolgáltatásportfóliót és szalonok közötti átfedést optimalizálja. Arra jó, hogy ugyanabból a kapacitásból jobb teljesítményt érj el.",features:["Munkaerő-optimalizáló","Intelligens műszaktervezés","Munkatársi bevételi coach","Szolgáltatásportfólió","Kannibalizációfigyelés"]},
  p5:{title:"VIR P5 · Fejlett vezetői intelligencia",purpose:"Üzleti szimulációt, célból akciótervet, végrehajtás előtti hatásvizsgálatot, versenyhelyzet- és terjeszkedési elemzést ad. Arra jó, hogy nagyobb vezetői döntéseket még a végrehajtás előtt számokkal tesztelj.",features:["Digitális iker","Célból akcióterv","Akció-előnézet","Versenyhelyzet","Telephely-bővítés"]},
  p6:{title:"VIR P6 · Automatikus bevételnövelés és vendégélmény",purpose:"AI-recepcióst, intelligens időpontkiosztást, elvesző foglalások visszaszerzését és konzultációs támogatást fog össze. Arra jó, hogy több érdeklődőből legyen tényleges foglalás, és kevesebb kapacitás maradjon üresen.",features:["AI-recepciós","Intelligens időpontkiosztás","Foglalás-visszaszerzés","AI foglalási átjáró","Külső versenytársfigyelés","AI-konzultáció"]},
  p7:{title:"VIR P7 · Kereskedelmi és üzembiztonsági intelligencia",purpose:"Az előleg- és no-show védelmet, tagsági bevételt, kommunikációt, offline működést, API-kat és kontrollált végrehajtást kezeli. Arra jó, hogy a bevételtermelő automatizmusok biztonságosan és auditálhatóan működjenek.",features:["Előleg és no-show védelem","Tagsági bevétel","Egységes kommunikáció","Offline VIR","Nyílt API és webhookok","Jóváhagyott végrehajtás"]},
  p8:{title:"VIR P8 · Kommunikációs és bevételautomatizálási réteg",purpose:"Egyesíti a vendégek csatornaazonosítóit és beszélgetéseit, kitölti az üres időpontokat, optimalizálja a kommunikációs csatornát és méri a beszélgetésekhez köthető bevételt. Arra jó, hogy a kommunikáció közvetlenül mérhető üzleti eredményt termeljen.",features:["Többcsatornás ügyfélazonosítás","Egységes üzenetközpont","AI-recepciós 2.0","Üres időpontok visszatöltése","Csatornaoptimalizálás","Bevétel-hozzárendelés"]},
  p9:{title:"VIR P9 · Marketingautomatizálás",purpose:"A marketingjelzéseket és kampánylehetőségeket automatizálható, mérhető folyamatokká alakítja. Arra jó, hogy a megfelelő vendéget a megfelelő ajánlattal, megfelelő időben lehessen megszólítani.",features:["Kampányautomatizálás","Célcsoportok","Ajánlások","Marketingeredmények"]},
  p10:{title:"VIR P10 · Bevételi autopilóta",purpose:"A bevételnövelő lehetőségeket folyamatosan keresi, rangsorolja és kontrollált végrehajtásra készíti elő. Arra jó, hogy a rendszer ne csak jelezze a problémát, hanem konkrét bevételi akciót is javasoljon.",features:["Bevételi lehetőségek","Akciójavaslatok","Prioritás","Mérhető hatás"]},
  p11:{title:"VIR P11 · AI-recepció és vendégút",purpose:"Az érdeklődéstől a foglalásig és a visszatérésig támogatja a vendég útját mesterséges intelligenciával. Arra jó, hogy kevesebb érdeklődő vesszen el, és egységesebb legyen a vendégélmény.",features:["AI-recepció","Vendégút","Foglalási támogatás","Visszatérés"]},
  p12:{title:"VIR P12 · Vendégút-vezérlés",purpose:"A vendégút következő lépéseit események és üzleti szabályok alapján szervezi össze. Arra jó, hogy minden vendég következetes, személyre szabott utánkövetést kapjon.",features:["Vendégút-lépések","Eseményvezérlés","Utánkövetés","Személyre szabás"]},
  p13:{title:"VIR P13 · Bevételvédelem",purpose:"A kieső vagy veszélyeztetett bevételi pontokat felismeri és helyreállítási lehetőségeket mutat. Arra jó, hogy csökkenjen a no-show, a lemondás, az üres kapacitás és más bevételveszteség.",features:["Bevételkockázat","Megelőzés","Visszaszerzés","Védelem"]},
  p14:{title:"VIR P14 · Működési autopilóta",purpose:"A napi operatív eltéréseket figyeli, teendővé alakítja és kontrollált automatizálásra készíti elő. Arra jó, hogy a rutinszerű vezetői ellenőrzésből minél több automatizálható legyen.",features:["Operatív eltérések","Automatikus teendők","Munkafolyamatok","Kontrollált végrehajtás"]},
  p15:{title:"VIR P15 · Vezetői autopilóta",purpose:"A hálózati szintű üzleti jelzéseket vezetői döntési javaslatokká rendezi, és az elfogadott lépések végrehajtását követi. Arra jó, hogy a vezetés a kivételekre és a valódi döntésekre koncentrálhasson.",features:["Vezetői jelzések","Döntési javaslatok","Jóváhagyás","Végrehajtáskövetés"]},
  p16:{title:"VIR P16 · Vezetői intelligencia 2.0",purpose:"A fontos kivételeket és döntési helyzeteket egyetlen vezetői nézetbe sűríti. Arra jó, hogy ne kelljen minden irányítópultot végignézni: csak azt emeli ki, ami ma vezetői döntést igényel.",features:["Reggeli vezetői összefoglaló","Kivételriport","Döntési postaláda","Döntési prioritás"]},
};

const GUIDE_BY_PATH: Record<string, GuideKey> = {
  "/admin/vir":"cockpit", "/admin/vir/cockpit":"cockpit", "/admin/vir/actions":"actions", "/admin/vir/intelligence":"p0",
  "/admin/vir/p1":"p1", "/admin/vir/p2":"p2", "/admin/vir/p3":"p3", "/admin/vir/p3/revenue-leakage":"revenue-leakage",
  "/admin/vir/p4":"p4", "/admin/vir/p5":"p5", "/admin/vir/p6":"p6", "/admin/vir/p7":"p7", "/admin/vir/p8":"p8",
  "/admin/vir/p9":"p9", "/admin/vir/p10":"p10", "/admin/vir/p11":"p11", "/admin/vir/p12":"p12", "/admin/vir/p13":"p13",
  "/admin/vir/p14":"p14", "/admin/vir/p15":"p15", "/admin/vir/p16":"p16",
};

export function resolveVirGuidePage(pathname: string): GuideKey | null { return GUIDE_BY_PATH[pathname] ?? null; }

export function VirHungarianPageGuide({ page, children }: { page: GuideKey; children: ReactNode }) {
  const guide = VIR_HUNGARIAN_GUIDES[page];
  return <div className="vir-hu-intelligence-page">
    <style>{`.vir-hu-intelligence-page > .vir-management-page > .vir-management-header > div:first-child{display:none}`}</style>
    <section className="vir-panel" style={{marginBottom:18}}>
      <div className="vir-panel-title" style={{fontSize:24}}>{guide.title}</div>
      <div className="vir-panel-muted" style={{marginTop:8}}><strong>Mire jó?</strong> {guide.purpose}</div>
      <div className="vir-badge-row" style={{marginTop:12}}>{guide.features.map(feature=><span className="vir-badge" key={feature}>{feature}</span>)}</div>
    </section>
    {children}
  </div>;
}
