import React from"react";
import{ArrowRightLeft,DatabaseZap,Users}from"lucide-react";
import PlatformTenantPanel from"./PlatformTenantPanel";
import SaasQuotaUsagePanel from"./SaasQuotaUsagePanel";
import ProvisioningRecoveryPanel from"./ProvisioningRecoveryPanel";
import TenantOnboardingPanel from"./TenantOnboardingPanel";
import LifecyclePolicyPanel from"./LifecyclePolicyPanel";
import SaasRevenueEnginePanel from"./SaasRevenueEnginePanel";
import SaasFranchiseAdminCorePage from"./SaasFranchiseAdminCorePage";
import FranchiseSettlementPanel from"./FranchiseSettlementPanel";
import MigrationCenterPage from"./MigrationCenterPage";
import KleoTeamAdminPanel from"./KleoTeamAdminPanel";

const Back=()=> <div style={{margin:"0 0 14px"}}><a href="/admin/saas" style={{display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none",color:"#604171",fontWeight:700}}>← Vissza a SaaS adminhoz</a></div>;
/** SaaS / Franchise platform administration and controlled tenant onboarding. */
export default function SaasFranchiseAdminPage(){
 const workspace=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("workspace"):null;
 if(workspace==="migration-center")return <><Back/><MigrationCenterPage/></>;
 if(workspace==="kleo-team")return <><Back/><KleoTeamAdminPanel/></>;
 if(workspace==="kleo-team-subscription")return <><Back/><section style={{marginBottom:16,padding:20,border:"1px solid #e4d8eb",borderRadius:18,background:"#fff"}}><strong style={{fontSize:18}}>Kleo Team előfizetés és számlázás</strong><p style={{margin:"6px 0 12px",color:"#716a74"}}>A Kleo Team nem külön billing rendszert használ: a VIR SaaS Revenue Engine kezeli a csomagot, számlázási ciklust, Stripe checkoutot, billing portalt, limiteket és dunning folyamatot.</p><a href="/admin/saas?workspace=kleo-team" style={{color:"#604171",fontWeight:700,textDecoration:"none"}}>Kleo Team adminisztráció →</a></section><SaasRevenueEnginePanel/></>;
 return <>
  <section style={{margin:"0 0 14px",padding:22,border:"1px solid #e4d8eb",borderRadius:20,background:"linear-gradient(135deg,#fff,#faf5fd)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:14,alignItems:"center"}}><span style={{width:46,height:46,borderRadius:14,display:"grid",placeItems:"center",background:"#eee4f4",color:"#68467a"}}><Users size={23}/></span><div><strong style={{display:"block",fontSize:18}}>Kleo Team Control Center</strong><span style={{display:"block",marginTop:4,color:"#716a74"}}>Dolgozói portál, modulkapcsolók és munkatársonkénti hozzáférések központi adminisztrációja.</span></div></div>
   <a href="/admin/saas?workspace=kleo-team" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"11px 15px",borderRadius:12,textDecoration:"none",background:"#604171",color:"white",fontWeight:700}}>Kleo Team admin megnyitása</a>
  </section>
  <section style={{margin:"0 0 20px",padding:22,border:"1px solid #e4d8eb",borderRadius:20,background:"linear-gradient(135deg,#fff,#faf5fd)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:14,alignItems:"center"}}><span style={{width:46,height:46,borderRadius:14,display:"grid",placeItems:"center",background:"#eee4f4",color:"#68467a"}}><DatabaseZap size={23}/></span><div><strong style={{display:"block",fontSize:18}}>VIR Migrációs Központ v19</strong><span style={{display:"block",marginTop:4,color:"#716a74"}}>Teljes VIR PostgreSQL tábla-katalógus migrációja Altegio, Booksy, Fresha, Excel és CSV forrásból, staginggel, tenant-védelemmel és rollbackkel.</span></div></div>
   <a href="/admin/saas?workspace=migration-center" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"11px 15px",borderRadius:12,textDecoration:"none",background:"#604171",color:"white",fontWeight:700}}><ArrowRightLeft size={18}/> Migrációs Központ megnyitása</a>
  </section>
  <PlatformTenantPanel/><SaasQuotaUsagePanel/><LifecyclePolicyPanel/><SaasRevenueEnginePanel/><ProvisioningRecoveryPanel/><TenantOnboardingPanel/><SaasFranchiseAdminCorePage/><FranchiseSettlementPanel/>
 </>;
}