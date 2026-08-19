import React from "react";
import AppLegacy from "./AppLegacy";
import AppLayout from "./layouts/AppLayout";
import MigrationCenterPage from "./pages/MigrationCenterPage";
import BrandLoadingScreen from "./components/BrandLoadingScreen";
import { hasStoredRole } from "./utils/roles";

function getToken(){try{return localStorage.getItem("kleo_token")||localStorage.getItem("token")}catch{return null}}

export default function App(){
  const path=typeof window!=="undefined"?window.location.pathname.replace(/\/+$/,"")||"/":"/";
  if(path==="/admin/migration-center"){
    if(!getToken()){if(typeof window!=="undefined")window.location.replace("/login");return <BrandLoadingScreen/>;}
    if(!hasStoredRole(["admin"])){if(typeof window!=="undefined")window.location.replace("/");return <BrandLoadingScreen/>;}
    return <AppLayout><MigrationCenterPage/></AppLayout>;
  }
  return <AppLegacy/>;
}
