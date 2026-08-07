import React from "react";
import ServiceHierarchyPanel from "../components/ServiceHierarchyPanel";

export default function ServiceCategoriesPage() {
  return (
    <div style={{ padding: "18px" }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Szolgáltatási kategóriák</h1>
        <p style={{ margin: "6px 0 0", color: "#6f6b63" }}>
          A szolgáltatások kategóriahierarchiája. Az Altegio import a kategóriák eredeti sorrendjét és hozzárendeléseit megőrzi.
        </p>
      </div>
      <ServiceHierarchyPanel />
    </div>
  );
}
