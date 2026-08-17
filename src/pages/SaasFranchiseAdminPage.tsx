import React from"react";
import PlatformTenantPanel from"./PlatformTenantPanel";
import SaasQuotaUsagePanel from"./SaasQuotaUsagePanel";
import ProvisioningRecoveryPanel from"./ProvisioningRecoveryPanel";
import TenantOnboardingPanel from"./TenantOnboardingPanel";
import LifecyclePolicyPanel from"./LifecyclePolicyPanel";
import SaasFranchiseAdminCorePage from"./SaasFranchiseAdminCorePage";
import FranchiseSettlementPanel from"./FranchiseSettlementPanel";

/**
 * SaaS / Franchise admin composition.
 * Platform-level tenant administration, quota usage, lifecycle policy, recovery and onboarding are isolated from
 * tenant-local settings and the auditable monthly royalty settlement workflow.
 */
export default function SaasFranchiseAdminPage(){
 return <>
  <PlatformTenantPanel/>
  <SaasQuotaUsagePanel/>
  <LifecyclePolicyPanel/>
  <ProvisioningRecoveryPanel/>
  <TenantOnboardingPanel/>
  <SaasFranchiseAdminCorePage/>
  <FranchiseSettlementPanel/>
 </>;
}
