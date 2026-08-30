import React from "react";
import KioskAdmin from "./KioskAdmin";
import KioskProductManager from "./KioskProductManager";
import KioskExperienceAdmin from "./KioskExperienceAdmin";

export default function KioskAdminEnhanced() {
  return <>
    <KioskAdmin />
    <KioskExperienceAdmin />
    <KioskProductManager />
  </>;
}
