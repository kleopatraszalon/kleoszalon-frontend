import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { hasStoredRole } from "../utils/roles";
import FixedAssetGovernancePanel from "../components/FixedAssetGovernancePanel";
import FinanceWorkspacePage from "./finance/FinanceWorkspacePage";
import PenzugyLegacy from "./PenzugyLegacy";
import ProductSalePage from "./ProductSalePage";
import ReceiptCompliancePage from "./ReceiptCompliancePage";
import ReceiptDocumentsPage from "./ReceiptDocumentsPage";
import ExternalDocumentIntakePage from "./ExternalDocumentIntakePage";
import AltegioDataIntakePage from "./AltegioDataIntakePage";
import ExternalInvoiceNavPage from "./ExternalInvoiceNavPage";
import FitnessPage from "./FitnessPage";
import FitnessLockerPanel from "./FitnessLockerPanel";
import FitnessLockerKiosk from "./FitnessLockerKiosk";
import ReconciliationCenterPage from "./ReconciliationCenterPage";
import ExecutiveAiAssistantPage from "./ExecutiveAiAssistantPage";
import TransactionTracePage from "./TransactionTracePage";
import FixedAssetsPage from "./FixedAssetsPage";
import ExceptionCommandCenterPage from "./ExceptionCommandCenterPage";
import ExceptionIntelligencePage from "./ExceptionIntelligencePage";
import ExceptionCapaPage from "./ExceptionCapaPage";
import CapaManagementWorkqueuePage from "./CapaManagementWorkqueuePage";
import MajorIncidentWarRoomPage from "./MajorIncidentWarRoomPage";
import ResilienceRecoveryPage from "./ResilienceRecoveryPage";
import BusinessContinuityGameDayPage from "./BusinessContinuityGameDayPage";
import OperationalRiskControlRegisterPage from "./OperationalRiskControlRegisterPage";
import "./TransactionTraceForensics.css";

/** Finance v5 route adapter. */
export default function Penzugy() {
  const { pathname } = useLocation();
  const management = hasStoredRole(["admin", "manager"]);
  if(pathname === "/finance/product-sale") return <ProductSalePage />;
  if(pathname === "/finance/receipt-compliance") return <ReceiptCompliancePage />;
  if(pathname === "/finance/receipts") return <ReceiptDocumentsPage />;
  if(pathname === "/finance/document-intake") return <ExternalDocumentIntakePage />;
  if(pathname === "/finance/altegio") return <AltegioDataIntakePage />;
  if(pathname === "/finance/nav-online-invoice") return <ExternalInvoiceNavPage />;
  if(pathname.startsWith("/finance/fixed-assets")) return <><FixedAssetGovernancePanel/><FixedAssetsPage /></>;
  if(pathname.startsWith("/finance/reconciliation")) return <ReconciliationCenterPage />;
  if(pathname.startsWith("/finance/transaction-trace")) return <TransactionTracePage />;
  if(pathname.startsWith("/finance/exception-command-center/risk-register")) return management ? <OperationalRiskControlRegisterPage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/exception-command-center/gameday")) return management ? <BusinessContinuityGameDayPage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/exception-command-center/resilience")) return management ? <ResilienceRecoveryPage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/exception-command-center/major-incidents")) return management ? <MajorIncidentWarRoomPage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/exception-command-center/intelligence")) return management ? <ExceptionIntelligencePage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/exception-command-center/capa/workqueue")) return management ? <CapaManagementWorkqueuePage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/exception-command-center/capa")) return management ? <ExceptionCapaPage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/exception-command-center")) return management ? <ExceptionCommandCenterPage /> : <Navigate to="/finance" replace />;
  if(pathname.startsWith("/finance/executive-ai")) return <ExecutiveAiAssistantPage />;
  if(pathname === "/finance/fitness/lockers/kiosk") return <FitnessLockerKiosk />;
  if(pathname === "/finance/fitness/lockers") return <FitnessLockerPanel />;
  if(pathname === "/finance/fitness") return <FitnessPage />;
  if(pathname.startsWith("/finance/fitness/")) return <FitnessPage />;
  const legacyFlow = pathname === "/finance/cashier" || pathname.startsWith("/finance/cashier/") || pathname === "/finance/checkout" || pathname.startsWith("/finance/checkout/") || pathname.startsWith("/finance/invoices/");
  if(legacyFlow) return <PenzugyLegacy />;
  return <>
    <div style={{maxWidth:1680,margin:"14px auto -6px",padding:"0 28px",display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}}>
      <Link to="/finance/document-intake" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#166534",color:"white"}}>Bizonylat-beérkeztetés</Link>
      <Link to="/finance/altegio" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#0f766e",color:"white"}}>Altegio szinkron / import</Link>
      <Link to="/finance/nav-online-invoice" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#1d4ed8",color:"white"}}>NAV Online Számla</Link>
      <Link to="/finance/receipts" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#3b2458",color:"white"}}>Számítógépes nyugták</Link>
      <Link to="/finance/fixed-assets" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#6e56a3",color:"white"}}>Tárgyi eszközök</Link>
      {management&&<Link to="/finance/exception-command-center" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#991b1b",color:"white"}}>Exception Command Center</Link>}
      {management&&<Link to="/finance/exception-command-center/intelligence" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#312e81",color:"white"}}>Exception Intelligence</Link>}
      {management&&<Link to="/finance/exception-command-center/capa" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#5b21b6",color:"white"}}>CAPA központ</Link>}
      {management&&<Link to="/finance/exception-command-center/capa/workqueue" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#4338ca",color:"white"}}>CAPA vezetői munkasor</Link>}
      {management&&<Link to="/finance/exception-command-center/major-incidents" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#7f1d1d",color:"white"}}>Major Incident / War Room</Link>}
      {management&&<Link to="/finance/exception-command-center/resilience" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#0f766e",color:"white"}}>Resilience & Recovery</Link>}
      {management&&<Link to="/finance/exception-command-center/gameday" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#115e59",color:"white"}}>Üzletmenet-folytonossági GameDay</Link>}
      {management&&<Link to="/finance/exception-command-center/risk-register" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#1e3a8a",color:"white"}}>Operational Risk & Control</Link>}
      <Link to="/finance/executive-ai" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#4c3b91",color:"white"}}>AI vezetői asszisztens</Link>
      <Link to="/finance/reconciliation" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#172554",color:"white"}}>Pénzügyi egyeztető központ</Link>
      <Link to="/finance/transaction-trace" style={{textDecoration:"none",fontWeight:800,fontSize:13,padding:"9px 13px",borderRadius:10,background:"#0f766e",color:"white"}}>Tranzakció-életút</Link>
    </div>
    <FinanceWorkspacePage />
  </>;
}