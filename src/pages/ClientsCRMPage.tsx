import React from "react";
import { useParams } from "react-router-dom";
import ClientsCRMCore from "./ClientsCRMCore";
import ClientDuplicateReviewPage from "./ClientDuplicateReviewPage";
import ClientFormsVersionPage from "./ClientFormsVersionPage";
import ClientGovernanceLauncher from "./clients/ClientGovernanceLauncher";

export default function ClientsCRMPage(){
  const { view }=useParams();
  if(view==="duplicate-review") return <ClientDuplicateReviewPage/>;
  if(view==="forms") return <ClientFormsVersionPage/>;
  return <>
    <ClientsCRMCore/>
    <ClientGovernanceLauncher/>
  </>;
}
