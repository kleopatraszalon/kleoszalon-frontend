import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { hasStoredRole } from "../utils/roles";
import FixedAssetGovernancePanel from "../components/FixedAssetGovernancePanel";
import FinanceWorkspacePage from "./finance/FinanceWorkspacePage";
import PenzugyLegacy from "./PenzugyLegacy";
import ProductSalePage from "./ProductSalePage";
import ReceiptCompliancePage from "./ReceiptCompliancePage";
import FitnessPage from "./FitnessPage";
import FitnessLockerPanel from "./FitnessLockerPanel";
import FitnessLockerKiosk from "./FitnessLockerKiosk";
import ReconciliationCenterPage from "./ReconciliationCenterPage";
import ExecutiveAiAssistantPage from "./ExecutiveAiAssistantPage";
import TransactionTracePage from "./TransactionTracePage";
import FixedAssetsPage from "./FixedAssetsPage";
import ExceptionCommandCenterPage from "./ExceptionCommandCenterPage";
import ExceptionIntelligencePage from "./ExceptionIntelligencePage";
import "./TransactionTraceForensics.css";

/**
 * Finance v5 route adapter.
 *
 * The modern Finance workspace owns the general finance routes while the
 * existing operational cashier/checkout and invoice flows stay on the proven
 * legacy screen. Direct retail product sales have their own work-order-free
 * screen under /finance/product-sale. Receipt/NAV compliance is isolated under
 * /finance/receipt-compliance and aggregates both work orders and retail sales.
 * The reconciliation center owns daily end-to-end financial and stock integrity.
 * Transaction Trace provides tamper-evident lifecycle proof for individual
 * business transactions. Exception Command Center is the cross-functional
 * management work queue for automatically detected business exceptions, while
 * Exception Intelligence provides recurrence, escalation and root-cause analytics.
 * The fixed-asset workspace owns asset lifecycle, maintenance, spare-parts,
 * depreciation and general-ledger integration. Its accounting governance panel
 * makes chart mapping and policy approval readiness explicit before posting.
 */

export default function Penzugy() {
  const { pathname } = useLocation();
  const management = hasStoredRole(["admin", "manager"]);
  if(pathname === "/finance/product-sale") return <ProductSalePage />;
  if(pathname === "/finance/receipt-compliance") return <ReceiptCompliancePage />;
  if(pathname.startsWith("/finance/fixed-assets")) return <><FixedAssetGovernancePanel/><FixedAssetsPage /></>;
  if(pathname.startsWith("/finance/reconciliation")) return <ReconciliationCenterPage />;
  if(pathname.startsWith("/finance/transaction-trace")) return <TransactionTracePage />;
  if(pathname.startsWith("/finance/exception-command-center/intelligence")) return management ? <ExceptionIntelligencePage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/exception-command-center")) return management ? <ExceptionCommandCenterPage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/executive-ai")) return <ExecutiveAiAssistantPage />;
  if(pathname === "/finance/fitness/lockers/kiosk") return <FitnessLockerKiosk />;
  if(pathname === "/finance/fitness/lockers") return <FitnessLockerPanel />;
  if(pathname === "/finance/fitness") return <FitnessPage />;
  if(pathname.startsWith("/finance/fitness/")) return <FitnessPage />;
  const legacyFlow =
    pathname === "/finance/cashier" ||
    pathname.startsWith("/finance/cashier/") ||
    pathname === "/finance/checkout" ||
    pathname.startsWith("/finance/checkout/") ||
    pathname.startsWith("/finance/invoices/");

  if(legacyFlow) return <PenzugyLegacy />;
  return <>
    <div style={{maxWidth:1680,margin:"14px auto -6px",padding:"0 28px",display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}}>
      <Link to="/finance/fixed-assets" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#6e56a3",color:"white"}}>Tárgyi eszközök</Link>
      {management&&<Link to="/finance/exception-command-center" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#991b1b",color:"white"}}>Exception Command Center</Link>}
      {management&&<Link to="/finance/exception-command-center/intelligence" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#312e81",color:"white"}}>Exception Intelligence</Link>}
      <Link to="/finance/executive-ai" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#4c3b91",color:"white"}}>AI vezetői asszisztens</Link>
      <Link to="/finance/reconciliation" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#172554",color:"white"}}>Pénzügyi egyeztető központ</Link>
      <Link to="/finance/transaction-trace" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#0f766e",color:"white"}}>Tranzakció-életút</Link>
    </div>
    <FinanceWorkspacePage />
  </>;
}