import React from"react";
import SaasFranchiseAdminCorePage from"./SaasFranchiseAdminCorePage";
import FranchiseSettlementPanel from"./FranchiseSettlementPanel";

/**
 * SaaS / Franchise admin composition.
 * Core tenant/subscription/franchise configuration remains isolated from the
 * auditable monthly royalty settlement panel so both can evolve independently.
 */
export default function SaasFranchiseAdminPage(){
 return <>
  <SaasFranchiseAdminCorePage/>
  <FranchiseSettlementPanel/>
 </>;
}
