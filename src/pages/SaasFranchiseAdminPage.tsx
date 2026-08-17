import React from"react";
import PlatformTenantPanel from"./PlatformTenantPanel";
import ProvisioningRecoveryPanel from"./ProvisioningRecoveryPanel";
import TenantOnboardingPanel from"./TenantOnboardingPanel";
import LifecyclePolicyPanel from"./LifecyclePolicyPanel";
import SaasFranchiseAdminCorePage from"./SaasFranchiseAdminCorePage";
import FranchiseSettlementPanel from"./FranchiseSettlementPanel";

/**
 * SaaS / Franchise admin composition.
 * Platform-level tenant administration, lifecycle policy, recovery and onboarding are isolated from
 * tenant-local settings and the auditable monthly royalty settlement workflow.
 */
export default function SaasFranchiseAdminPage(){
 return <>
  <PlatformTenantPanel/>
  <LifecyclePolicyPanel/>
  <ProvisioningRecoveryPanel/>
  <TenantOnboardingPanel/>
  <SaasFranchiseAdminCorePage/>
  <FranchiseSettlementPanel/>
 </>;
}
