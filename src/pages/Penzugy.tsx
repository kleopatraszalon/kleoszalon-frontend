import React from "react";
import { useLocation } from "react-router-dom";
import FinanceWorkspacePage from "./finance/FinanceWorkspacePage";
import PenzugyLegacy from "./PenzugyLegacy";
import ProductSalePage from "./ProductSalePage";
import ReceiptCompliancePage from "./ReceiptCompliancePage";
import FitnessPage from "./FitnessPage";
import FitnessLockerPanel from "./FitnessLockerPanel";
import FitnessLockerKiosk from "./FitnessLockerKiosk";

/**
 * Finance v5 route adapter.
 *
 * The modern Finance workspace owns the general finance routes while the
 * existing operational cashier/checkout and invoice flows stay on the proven
 * legacy screen. Direct retail product sales have their own work-order-free
 * screen under /finance/product-sale. Receipt/NAV compliance is isolated under
 * /finance/receipt-compliance and aggregates both work orders and retail sales.
 * Gyöngyös Fitness uses /finance/fitness so it can be shipped without opening
 * a generic route to other salons; its backend enforces the location scope.
 * The 20-compartment locker subsystem has a receptionist/admin display and a
 * dedicated full-screen guest kiosk display for the second monitor.
 */
export default function Penzugy() {
  const { pathname } = useLocation();
  if(pathname === "/finance/product-sale") return <ProductSalePage />;
  if(pathname === "/finance/receipt-compliance") return <ReceiptCompliancePage />;
  if(pathname === "/finance/fitness/lockers/kiosk") return <FitnessLockerKiosk />;
  if(pathname === "/finance/fitness/lockers") return <FitnessLockerPanel />;
  if(pathname === "/finance/fitness") return <><FitnessPage/><button type="button" onClick={()=>window.location.assign('/finance/fitness/lockers')} style={{position:'fixed',right:24,bottom:24,zIndex:50,border:0,borderRadius:14,padding:'13px 17px',background:'#8d2359',color:'#fff',fontWeight:900,boxShadow:'0 12px 35px rgba(80,30,55,.25)',cursor:'pointer'}}>🔐 Öltözőszekrények</button></>;
  if(pathname.startsWith("/finance/fitness/")) return <FitnessPage />;
  const legacyFlow =
    pathname === "/finance/cashier" ||
    pathname.startsWith("/finance/cashier/") ||
    pathname === "/finance/checkout" ||
    pathname.startsWith("/finance/checkout/") ||
    pathname.startsWith("/finance/invoices/");

  return legacyFlow ? <PenzugyLegacy /> : <FinanceWorkspacePage />;
}