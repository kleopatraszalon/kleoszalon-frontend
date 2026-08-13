import React from "react";
import ClientsCRMCore from "./ClientsCRMCore";
import ClientGovernanceLauncher from "./clients/ClientGovernanceLauncher";

export default function ClientsCRMPage(){
  return <>
    <ClientsCRMCore/>
    <ClientGovernanceLauncher/>
  </>;
}
