import React from"react";
import PlatformTenantPanel from"./PlatformTenantPanel";
import SaasFranchiseAdminCorePage from"./SaasFranchiseAdminCorePage";
import FranchiseSettlementPanel from"./FranchiseSettlementPanel";

/**
 * SaaS / Franchise admin composition.
 * Platform-level tenant administration is isolated from tenant-local settings
 * and the auditable monthly royalty settlement workflow.
 */
export default function SaasFranchiseAdminPage(){
 return <>
  <PlatformTenantPanel/>
  <SaasFranchiseAdminCorePage/>
  <FranchiseSettlementPanel/>
 </>;
}
