import type { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import "../pages/VirManagement.css";

export type GuideKey = "cockpit" | "actions" | "p0" | "p1" | "p2" | "p3" | "revenue-leakage" | "p4" | "p5" | "p6" | "p7" | "p8" | "p9" | "p10" | "p11" | "p12" | "p13" | "p14" | "p15" | "p16";
type GuideDefinition = { title: string; purpose: string; features: string[] };

export const VIR_HUNGARIAN_GUIDES: Record<GuideKey, GuideDefinition> = {
  cockpit:{title:"VIR · Vezetői irányítópult",purpose:"A napi üzleti állapotot, a fő kockázatokat és a vezetői teendőket egyetlen képernyőn mutatja. Arra jó, hogy gyorsan lásd, hol kell még ma beavatkozni.",features:["Napi KPI-k","Kritikus teendők","Vezetői prioritások"]},
  actions:{title:"VIR · Egységes akcióközpont",purpose:"A VIR által jelzett teendőket prioritás, határidő és felelős szerint gyűjti össze. Arra jó, hogy egyetlen felületen lehessen követni, mi nyitott, mi késik és mi vár jóváhagyásra.",features:["Teendők","Határidők","Jóváhagyások"]},
  p0:{title:"VIR · Alap üzleti intelligencia",purpose:"A profitabilitást, kapacitáskihasználást, naptári réseket, no-show kockázatot és várólistás lehetőségeket elemzi. Arra jó, hogy a napi működésből gyorsan több bevételt és jobb kihasználtságot lehessen kihozni.",features:["Jövedelmezőség","Kapacitásoptimalizálás","No-show és várólista"]},
  p1:{title:"VIR · Üzleti intelligencia",purpose:"Az ügyfélértéket, a 7/30/90 napos várható teljesítményt, a készlet- és kompetenciakockázatokat, valamint a vezetői szimulációkat mutatja. Arra jó, hogy előre lásd, hol várható üzleti probléma vagy növekedési lehetőség.",features:["Ügyfél 360°","7/30/90 napos előrejelzés","Intelligens készlet","Kompetenciamátrix","Üzleti szimulátor"]},
  p2:{title:"VIR · Mesterséges intelligencia és eltérésfigyelés",purpose:"AI-alapú vezetői kérdezést, anomáliafelismerést, automatikus összefoglalókat és szalonok közötti összehasonlítást ad. Arra jó, hogy a szokatlan eltérések és fontos vezetői jelzések ne maradjanak észrevétlenül.",features:["VIR AI-segéd","Anomáliák","Vezetői összefoglalók","Szalon-összehasonlítás"]},
  p3:{title:"VIR · Bevétel- és vendégmegtartási intelligencia",purpose:"A lemorzsolódó vendégeket, a következő várható látogatást, az árjavaslatokat és a tagsági potenciált elemzi. Arra jó, hogy több vendéget tarts meg és növeld az egy vendégre jutó bevételt.",features:["Lemorzsolódási radar","Következő látogatás","Intelligens árképzés","Tagsági lehetőségek"]},
  "revenue-leakage":{title:"VIR · Bevételszivárgás-figyelő",purpose:"Megkeresi azokat a pontokat, ahol a lefoglalt vagy elvégzett szolgáltatásból kevesebb bevétel realizálódik a vártnál. Arra jó, hogy azonosítsd és megszüntesd a rejtett bevételveszteségeket.",features:["Eltérések","Elvesző bevétel","Javítási lehetőségek"]},
  p4:{title:"VIR · Működési intelligencia",purpose:"A munkaerőt, műszakokat, munkatársi bevételt, szolgáltatásportfóliót és szalonok közötti átfedést optimalizálja. Arra jó, hogy ugyanabból a kapacitásból jobb teljesítményt érj el.",features:["Munkaerő-optimalizáló","Intelligens műszaktervezés","Munkatársi bevételi coach","Szolgáltatásportfólió","Kannibalizációfigyelés"]},
  p5:{title:"VIR · Fejlett vezetői intelligencia",purpose:"Üzleti szimulációt, célból akciótervet, végrehajtás előtti hatásvizsgálatot, versenyhelyzet- és terjeszkedési elemzést ad. Arra jó, hogy nagyobb vezetői döntéseket még a végrehajtás előtt számokkal tesztelj.",features:["Digitális iker","Célból akcióterv","Akció-előnézet","Versenyhelyzet","Telephely-bővítés"]},
  p6:{title:"VIR · Automatikus bevételnövelés és vendégélmény",purpose:"AI-recepcióst, intelligens időpontkiosztást, elvesző foglalások visszaszerzését és konzultációs támogatást fog össze. Arra jó, hogy több érdeklődőből legyen tényleges foglalás, és kevesebb kapacitás maradjon üresen.",features:["AI-recepciós","Intelligens időpontkiosztás","Foglalás-visszaszerzés","AI foglalási átjáró","Külső versenytársfigyelés","AI-konzultáció"]},
  p7:{title:"VIR · Kereskedelmi és üzembiztonsági intelligencia",purpose:"Az előleg- és no-show védelmet, tagsági bevételt, kommunikációt, offline működést, API-kat és kontrollált végrehajtást kezeli. Arra jó, hogy a bevételtermelő automatizmusok biztonságosan és auditálhatóan működjenek.",features:["Előleg és no-show védelem","Tagsági bevétel","Egységes kommunikáció","Offline VIR","Nyílt API és webhookok","Jóváhagyott végrehajtás"]},
  p8:{title:"VIR · Kommunikációs és bevételautomatizálási réteg",purpose:"Egyesíti a vendégek csatornaazonosítóit és beszélgetéseit, kitölti az üres időpontokat, optimalizálja a kommunikációs csatornát és méri a beszélgetésekhez köthető bevételt. Arra jó, hogy a kommunikáció közvetlenül mérhető üzleti eredményt termeljen.",features:["Többcsatornás ügyfélazonosítás","Egységes üzenetközpont","AI-recepciós 2.0","Üres időpontok visszatöltése","Csatornaoptimalizálás","Bevétel-hozzárendelés"]},
  p9:{title:"VIR · Marketingautomatizálás",purpose:"A marketingjelzéseket és kampánylehetőségeket automatizálható, mérhető folyamatokká alakítja. Arra jó, hogy a megfelelő vendéget a megfelelő ajánlattal, megfelelő időben lehessen megszólítani.",features:["Kampányautomatizálás","Célcsoportok","Ajánlások","Marketingeredmények"]},
  p10:{title:"VIR · Bevételi autopilóta",purpose:"A bevételnövelő lehetőségeket folyamatosan keresi, rangsorolja és kontrollált végrehajtásra készíti elő. Arra jó, hogy a rendszer ne csak jelezze a problémát, hanem konkrét bevételi akciót is javasoljon.",features:["Bevételi lehetőségek","Akciójavaslatok","Prioritás","Mérhető hatás"]},
  p11:{title:"VIR · AI-recepció és vendégút",purpose:"Az érdeklődéstől a foglalásig és a visszatérésig támogatja a vendég útját mesterséges intelligenciával. Arra jó, hogy kevesebb érdeklődő vesszen el, és egységesebb legyen a vendégélmény.",features:["AI-recepció","Vendégút","Foglalási támogatás","Visszatérés"]},
  p12:{title:"VIR · Vendégút-vezérlés",purpose:"A vendégút következő lépéseit események és üzleti szabályok alapján szervezi össze. Arra jó, hogy minden vendég következetes, személyre szabott utánkövetést kapjon.",features:["Vendégút-lépések","Eseményvezérlés","Utánkövetés","Személyre szabás"]},
  p13:{title:"VIR · Bevételvédelem",purpose:"A kieső vagy veszélyeztetett bevételi pontokat felismeri és helyreállítási lehetőségeket mutat. Arra jó, hogy csökkenjen a no-show, a lemondás, az üres kapacitás és más bevételveszteség.",features:["Bevételkockázat","Megelőzés","Visszaszerzés","Védelem"]},
  p14:{title:"VIR · Működési autopilóta",purpose:"A napi operatív eltéréseket figyeli, teendővé alakítja és kontrollált automatizálásra készíti elő. Arra jó, hogy a rutinszerű vezetői ellenőrzésből minél több automatizálható legyen.",features:["Operatív eltérések","Automatikus teendők","Munkafolyamatok","Kontrollált végrehajtás"]},
  p15:{title:"VIR · Vezetői autopilóta",purpose:"A hálózati szintű üzleti jelzéseket vezetői döntési javaslatokká rendezi, és az elfogadott lépések végrehajtását követi. Arra jó, hogy a vezetés a kivételekre és a valódi döntésekre koncentrálhasson.",features:["Vezetői jelzések","Döntési javaslatok","Jóváhagyás","Végrehajtáskövetés"]},
  p16:{title:"VIR · Vezetői intelligencia 2.0",purpose:"A fontos kivételeket és döntési helyzeteket egyetlen vezetői nézetbe sűríti. Arra jó, hogy ne kelljen minden irányítópultot végignézni: csak azt emeli ki, ami ma vezetői döntést igényel.",features:["Reggeli vezetői összefoglaló","Kivételriport","Döntési postaláda","Döntési prioritás"]},
};

const VIR_ENGLISH_GUIDES: Record<GuideKey, GuideDefinition> = {
  cockpit:{title:"VIR · Management dashboard",purpose:"Shows the daily business position, major risks and management tasks on one screen so leaders can see where intervention is needed today.",features:["Daily KPIs","Critical actions","Management priorities"]},
  actions:{title:"VIR · Unified action center",purpose:"Collects VIR actions by priority, deadline and owner so open, overdue and approval-pending work can be tracked in one place.",features:["Actions","Deadlines","Approvals"]},
  p0:{title:"VIR · Core business intelligence",purpose:"Analyzes profitability, capacity utilization, calendar gaps, no-show risk and waiting-list opportunities to improve daily revenue and utilization.",features:["Profitability","Capacity optimization","No-show & waiting list"]},
  p1:{title:"VIR · Business intelligence",purpose:"Shows customer value, 7/30/90-day outlooks, inventory and competency risks, and management simulations so problems and growth opportunities can be seen earlier.",features:["Customer 360°","7/30/90-day forecast","Smart inventory","Competency matrix","Business simulator"]},
  p2:{title:"VIR · AI and anomaly intelligence",purpose:"Provides AI-assisted management queries, anomaly detection, automated summaries and salon comparisons so important deviations are not missed.",features:["VIR AI assistant","Anomalies","Management summaries","Salon comparison"]},
  p3:{title:"VIR · Revenue and retention intelligence",purpose:"Analyzes churn risk, expected next visits, pricing suggestions and membership potential to improve retention and revenue per customer.",features:["Churn radar","Next visit","Smart pricing","Membership opportunities"]},
  "revenue-leakage":{title:"VIR · Revenue leakage monitor",purpose:"Finds points where booked or delivered services generate less revenue than expected so hidden losses can be identified and corrected.",features:["Deviations","Lost revenue","Corrective opportunities"]},
  p4:{title:"VIR · Operations intelligence",purpose:"Optimizes workforce, shifts, staff revenue, service portfolio and cross-salon overlap to achieve better output from the same capacity.",features:["Workforce optimizer","Smart shift planning","Staff revenue coach","Service portfolio","Cannibalization monitoring"]},
  p5:{title:"VIR · Advanced executive intelligence",purpose:"Provides business simulation, goal-to-action planning, pre-execution impact checks, competitive analysis and expansion analysis for evidence-based management decisions.",features:["Digital twin","Goal-to-action plan","Action preview","Competitive position","Location expansion"]},
  p6:{title:"VIR · Automated revenue growth and customer experience",purpose:"Combines AI reception, smart appointment allocation, booking recovery and consultation support to convert more demand and leave less capacity unused.",features:["AI receptionist","Smart appointment allocation","Booking recovery","AI booking gateway","External competitor monitoring","AI consultation"]},
  p7:{title:"VIR · Commercial and resilience intelligence",purpose:"Manages deposit/no-show protection, membership revenue, communications, offline operation, APIs and controlled execution so revenue automations remain safe and auditable.",features:["Deposit & no-show protection","Membership revenue","Unified communications","Offline VIR","Open API & webhooks","Approved execution"]},
  p8:{title:"VIR · Communication and revenue automation",purpose:"Unifies customer channel identities and conversations, fills empty slots, optimizes channel selection and measures revenue attributable to communications.",features:["Omnichannel identity","Unified inbox","AI receptionist 2.0","Empty-slot recovery","Channel optimization","Revenue attribution"]},
  p9:{title:"VIR · Marketing automation",purpose:"Turns marketing signals and campaign opportunities into measurable, controllable workflows so the right customer can receive the right offer at the right time.",features:["Campaign automation","Audiences","Recommendations","Marketing performance"]},
  p10:{title:"VIR · Revenue Autopilot",purpose:"Continuously finds and ranks revenue-growth opportunities and prepares them for controlled execution, turning alerts into concrete revenue actions.",features:["Revenue opportunities","Action proposals","Priority","Measurable impact"]},
  p11:{title:"VIR · AI reception and customer journey",purpose:"Supports the customer from inquiry through booking and return visits with AI so fewer leads are lost and the experience stays consistent.",features:["AI reception","Customer journey","Booking support","Return visits"]},
  p12:{title:"VIR · Customer journey orchestration",purpose:"Coordinates next customer-journey steps from events and business rules so every customer receives consistent, personalized follow-up.",features:["Journey steps","Event orchestration","Follow-up","Personalization"]},
  p13:{title:"VIR · Revenue protection",purpose:"Detects threatened or lost revenue points and presents recovery options to reduce no-shows, cancellations, empty capacity and other leakage.",features:["Revenue risk","Prevention","Recovery","Protection"]},
  p14:{title:"VIR · Operations Autopilot",purpose:"Monitors daily operational deviations, turns them into actions and prepares controlled automation so routine management checks can increasingly be automated.",features:["Operational deviations","Automatic actions","Workflows","Controlled execution"]},
  p15:{title:"VIR · Executive Autopilot",purpose:"Organizes network-level business signals into management decision proposals and tracks approved steps so leaders can focus on exceptions and real decisions.",features:["Management signals","Decision proposals","Approval","Execution tracking"]},
  p16:{title:"VIR · Executive intelligence 2.0",purpose:"Condenses important exceptions and decision situations into one management view so leaders only review what actually requires a decision today.",features:["Morning executive brief","Exception brief","Decision inbox","Decision priority"]},
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
  const { language } = useLanguage();
  const guide = language === "en" ? VIR_ENGLISH_GUIDES[page] : VIR_HUNGARIAN_GUIDES[page];
  const displayTitle = guide.title.replace(/^VIR\s*·\s*/i, "");
  return <div className={`vir-hu-intelligence-page vir-guide-${page}`}>
    <style>{`
      .vir-hu-intelligence-page > .vir-management-page > .vir-management-header > div:first-child{display:none}
      .vir-hu-intelligence-page > div:not(.vir-management-page) > h1:first-child{display:none}
      .vir-hu-intelligence-page > div:not(.vir-management-page) > h1:first-child + p{display:none}
      .vir-hu-intelligence-page > .vir-guide-hero{border:1px solid rgba(15,23,42,.08);border-radius:18px;background:linear-gradient(135deg,#fff 0%,#fff 70%,#fff6fb 100%);box-shadow:0 10px 32px rgba(15,23,42,.06);padding:22px 24px;margin-bottom:18px}
      .vir-hu-intelligence-page > .vir-guide-hero .vir-panel-title{font-size:clamp(22px,2vw,29px);line-height:1.15;letter-spacing:-.025em;color:#111827}
      .vir-hu-intelligence-page > .vir-guide-hero .vir-panel-muted{max-width:1100px;line-height:1.55;color:#5b6472}
      .vir-hu-intelligence-page > .vir-guide-hero .vir-badge-row{gap:8px}
      .vir-hu-intelligence-page > .vir-guide-hero .vir-badge{border-radius:999px;padding:6px 10px;background:#f4f6f9;border:1px solid #e7eaf0;color:#344054;font-weight:650}
      .vir-guide-p3 > .vir-management-page > .vir-panel > .vir-panel-title,
      .vir-guide-p5 > .vir-management-page > .vir-panel > .vir-panel-title{display:none}
      .vir-guide-p3 > .vir-management-page > .vir-panel,
      .vir-guide-p5 > .vir-management-page > .vir-panel{border-radius:18px;box-shadow:0 8px 26px rgba(15,23,42,.05);border-color:#e8ebf0}
      .vir-guide-p3 > .vir-management-page > .vir-management-actions,
      .vir-guide-p5 > .vir-management-page > .vir-management-actions{gap:10px;padding:12px 14px;border:1px solid #e8ebf0;border-radius:16px;background:#fff;box-shadow:0 6px 20px rgba(15,23,42,.04)}
      .vir-guide-p3 .vir-button,
      .vir-guide-p5 .vir-tabs button{border-radius:12px;min-height:38px}
      .vir-guide-p4 .p4-hero-copy{display:none}
      .vir-guide-p4 .p4-hero{min-height:0;padding:0;background:transparent;border:0;box-shadow:none;justify-content:flex-end;margin-bottom:12px}
      .vir-guide-p4 .p4-control-copy{display:none}
      .vir-guide-p4 .p4-control-card{justify-content:flex-end;min-height:0}
      .vir-guide-p4 .p4-module-kicker,
      .vir-guide-p4 .p4-module-header h2{display:none}
      .vir-guide-p4 .p4-module-header{align-items:flex-start;gap:16px}
      .vir-guide-p4 .p4-module-header p{margin:0;max-width:900px;line-height:1.55}
      @media (max-width:720px){
        .vir-hu-intelligence-page > .vir-guide-hero{padding:18px}
        .vir-guide-p4 .p4-hero{justify-content:stretch}
        .vir-guide-p4 .p4-hero-status{width:100%}
      }
    `}</style>
    <section className="vir-panel vir-guide-hero">
      <div className="vir-panel-title">{displayTitle}</div>
      <div className="vir-panel-muted" style={{marginTop:8}}><strong>{language === "en" ? "Purpose:" : "Mire jó?"}</strong> {guide.purpose}</div>
      <div className="vir-badge-row" style={{marginTop:12}}>{guide.features.map(feature=><span className="vir-badge" key={feature}>{feature}</span>)}</div>
    </section>
    {children}
  </div>;
}
