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

function FitnessNav({ active }: { active: "fitness" | "lockers" }) {
  const go = (path: string) => window.location.assign(path);
  const baseButton: React.CSSProperties = {
    border: "1px solid #eadde5",
    borderRadius: 12,
    padding: "11px 15px",
    background: "#fff",
    color: "#34232c",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(70,35,55,.06)",
  };
  const activeButton: React.CSSProperties = {
    ...baseButton,
    background: "#8d2359",
    color: "#fff",
    borderColor: "#8d2359",
  };

  return (
    <section
      aria-label="Fitness navigáció"
      style={{
        position: "sticky",
        top: 72,
        zIndex: 60,
        margin: "14px 20px 0",
        padding: "12px 14px",
        border: "1px solid #eadde5",
        borderRadius: 16,
        background: "rgba(255,255,255,.97)",
        boxShadow: "0 10px 28px rgba(70,35,55,.08)",
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <strong style={{ marginRight: 6 }}>🏋️ Gyöngyös Fitness</strong>
      <button type="button" onClick={() => go("/finance/fitness")} style={active === "fitness" ? activeButton : baseButton}>
        Áttekintés és bérletek
      </button>
      <button type="button" onClick={() => go("/finance/fitness/lockers")} style={active === "lockers" ? activeButton : baseButton}>
        🔐 Öltözőszekrények – 20 rekesz
      </button>
      <button type="button" onClick={() => go("/finance/fitness/lockers/kiosk")} style={{ ...baseButton, marginLeft: "auto" }}>
        🖥️ Vendég RFID kijelző megnyitása
      </button>
    </section>
  );
}

export default function Penzugy() {
  const { pathname } = useLocation();
  if(pathname === "/finance/product-sale") return <ProductSalePage />;
  if(pathname === "/finance/receipt-compliance") return <ReceiptCompliancePage />;
  if(pathname === "/finance/fitness/lockers/kiosk") return <FitnessLockerKiosk />;
  if(pathname === "/finance/fitness/lockers") return <><FitnessNav active="lockers"/><FitnessLockerPanel /></>;
  if(pathname === "/finance/fitness") return <><FitnessNav active="fitness"/><FitnessPage/></>;
  if(pathname.startsWith("/finance/fitness/")) return <><FitnessNav active="fitness"/><FitnessPage /></>;
  const legacyFlow =
    pathname === "/finance/cashier" ||
    pathname.startsWith("/finance/cashier/") ||
    pathname === "/finance/checkout" ||
    pathname.startsWith("/finance/checkout/") ||
    pathname.startsWith("/finance/invoices/");

  return legacyFlow ? <PenzugyLegacy /> : <FinanceWorkspacePage />;
}
