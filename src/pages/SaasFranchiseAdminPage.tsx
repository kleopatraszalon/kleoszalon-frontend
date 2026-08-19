import React from"react";
import{ArrowRightLeft,DatabaseZap}from"lucide-react";
import PlatformTenantPanel from"./PlatformTenantPanel";
import SaasQuotaUsagePanel from"./SaasQuotaUsagePanel";
import ProvisioningRecoveryPanel from"./ProvisioningRecoveryPanel";
import TenantOnboardingPanel from"./TenantOnboardingPanel";
import LifecyclePolicyPanel from"./LifecyclePolicyPanel";
import SaasFranchiseAdminCorePage from"./SaasFranchiseAdminCorePage";
import FranchiseSettlementPanel from"./FranchiseSettlementPanel";
import MigrationCenterPage from"./MigrationCenterPage";

/** SaaS / Franchise platform administration and controlled tenant onboarding. */
export default function SaasFranchiseAdminPage(){
 const migrationWorkspace=typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("workspace")==="migration-center";
 if(migrationWorkspace)return <><div style={{margin:"0 0 14px"}}><a href="/admin/saas" style={{display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none",color:"#604171",fontWeight:700}}>← Vissza a SaaS adminhoz</a></div><MigrationCenterPage/></>;
 return <>
  <section style={{margin:"0 0 20px",padding:22,border:"1px solid #e4d8eb",borderRadius:20,background:"linear-gradient(135deg,#fff,#faf5fd)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:14,alignItems:"center"}}><span style={{width:46,height:46,borderRadius:14,display:"grid",placeItems:"center",background:"#eee4f4",color:"#68467a"}}><DatabaseZap size={23}/></span><div><strong style={{display:"block",fontSize:18}}>VIR Migrációs Központ v19</strong><span style={{display:"block",marginTop:4,color:"#716a74"}}>Teljes VIR PostgreSQL tábla-katalógus migrációja Altegio, Booksy, Fresha, Excel és CSV forrásból, staginggel, tenant-védelemmel és rollbackkel.</span></div></div>
   <a href="/admin/saas?workspace=migration-center" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"11px 15px",borderRadius:12,textDecoration:"none",background:"#604171",color:"white",fontWeight:700}}><ArrowRightLeft size={18}/> Migrációs Központ megnyitása</a>
  </section>
  <PlatformTenantPanel/>
  <SaasQuotaUsagePanel/>
  <LifecyclePolicyPanel/>
  <ProvisioningRecoveryPanel/>
  <TenantOnboardingPanel/>
  <SaasFranchiseAdminCorePage/>
  <FranchiseSettlementPanel/>
 </>;
}
