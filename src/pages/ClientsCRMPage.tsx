import React from "react";
import { useParams } from "react-router-dom";
import ClientsCRMCore from "./ClientsCRMCore";
import ClientDuplicateReviewPage from "./ClientDuplicateReviewPage";
import ClientFormsVersionPage from "./ClientFormsVersionPage";
import CustomerIntelligencePage from "./CustomerIntelligencePage";
import ClientGovernanceLauncher from "./clients/ClientGovernanceLauncher";

export default function ClientsCRMPage(){
  const { view }=useParams();
  if(view==="duplicate-review") return <ClientDuplicateReviewPage/>;
  if(view==="forms") return <ClientFormsVersionPage/>;
  if(view==="intelligence") return <CustomerIntelligencePage/>;
  return <>
    <ClientsCRMCore/>
    <ClientGovernanceLauncher/>
  </>;
}
