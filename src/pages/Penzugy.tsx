import React from "react";
import { useLocation } from "react-router-dom";
import FinanceWorkspacePage from "./finance/FinanceWorkspacePage";
import PenzugyLegacy from "./PenzugyLegacy";

/**
 * Finance v5 route adapter.
 *
 * The modern Finance workspace owns the general finance routes while the
 * existing operational checkout and invoice flows stay on the proven legacy
 * screen. Keeping this decision here avoids replacing the current App router
 * and preserves all newer Stage17/mobile/master-data route work.
 */
export default function Penzugy() {
  const { pathname } = useLocation();
  const legacyFlow =
    pathname === "/finance/checkout" ||
    pathname.startsWith("/finance/invoices/");

  return legacyFlow ? <PenzugyLegacy /> : <FinanceWorkspacePage />;
}
