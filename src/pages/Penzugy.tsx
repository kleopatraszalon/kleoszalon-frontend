import React from "react";
import { useLocation } from "react-router-dom";
import FinanceWorkspacePage from "./finance/FinanceWorkspacePage";
import PenzugyLegacy from "./PenzugyLegacy";
import ProductSalePage from "./ProductSalePage";
import ReceiptCompliancePage from "./ReceiptCompliancePage";

/**
 * Finance v5 route adapter.
 *
 * The modern Finance workspace owns the general finance routes while the
 * existing operational cashier/checkout and invoice flows stay on the proven
 * legacy screen. Direct retail product sales have their own work-order-free
 * screen under /finance/product-sale. Receipt/NAV compliance is isolated under
 * /finance/receipt-compliance and aggregates both work orders and retail sales.
 */
export default function Penzugy() {
  const { pathname } = useLocation();
  if(pathname === "/finance/product-sale") return <ProductSalePage />;
  if(pathname === "/finance/receipt-compliance") return <ReceiptCompliancePage />;
  const legacyFlow =
    pathname === "/finance/cashier" ||
    pathname.startsWith("/finance/cashier/") ||
    pathname === "/finance/checkout" ||
    pathname.startsWith("/finance/checkout/") ||
    pathname.startsWith("/finance/invoices/");

  return legacyFlow ? <PenzugyLegacy /> : <FinanceWorkspacePage />;
}