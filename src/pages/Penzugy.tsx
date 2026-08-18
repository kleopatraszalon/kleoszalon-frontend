import React from "react";
import { Link, useLocation } from "react-router-dom";
import FinanceWorkspacePage from "./finance/FinanceWorkspacePage";
import PenzugyLegacy from "./PenzugyLegacy";
import ProductSalePage from "./ProductSalePage";
import ReceiptCompliancePage from "./ReceiptCompliancePage";
import FitnessPage from "./FitnessPage";
import FitnessLockerPanel from "./FitnessLockerPanel";
import FitnessLockerKiosk from "./FitnessLockerKiosk";
import ReconciliationCenterPage from "./ReconciliationCenterPage";

/**
 * Finance v5 route adapter.
 *
 * The modern Finance workspace owns the general finance routes while the
 * existing operational cashier/checkout and invoice flows stay on the proven
 * legacy screen. Direct retail product sales have their own work-order-free
 * screen under /finance/product-sale. Receipt/NAV compliance is isolated under
 * /finance/receipt-compliance and aggregates both work orders and retail sales.
 * The reconciliation center owns daily end-to-end financial and stock integrity.
 */

export default function Penzugy() {
  const { pathname } = useLocation();
  if(pathname === "/finance/product-sale") return <ProductSalePage />;
  if(pathname === "/finance/receipt-compliance") return <ReceiptCompliancePage />;
  if(pathname.startsWith("/finance/reconciliation")) return <ReconciliationCenterPage />;
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
    <div style={{maxWidth:1680,margin:"14px auto -6px",padding:"0 28px",display:"flex",justifyContent:"flex-end"}}>
      <Link to="/finance/reconciliation" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#172554",color:"white"}}>Pénzügyi egyeztető központ</Link>
    </div>
    <FinanceWorkspacePage />
  </>;
}
