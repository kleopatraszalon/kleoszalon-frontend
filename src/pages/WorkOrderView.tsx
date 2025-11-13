// File: frontend/src/pages/WorkOrderView.tsx
// Generated: 2025-11-12 22:16
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function WorkOrderView(){
  const { id } = useParams();
  const [header, setHeader] = useState<any>(null);

  useEffect(()=>{
    apiFetch("/api/workorders").then(r=>r.json()).then((all)=>{
      const h = all.find((x:any) => x.id === id);
      setHeader(h || null);
    });
  },[id]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Munkalap #{id?.slice(0,8)}</h1>
      {header ? (
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="border rounded p-3">
            <div className="text-xs opacity-60">Állapot</div>
            <div className="font-medium">{header.status}</div>
          </div>
          <div className="border rounded p-3">
            <div className="text-xs opacity-60">Ügyfél</div>
            <div className="font-medium">{header.client_name || "-"}</div>
          </div>
          <div className="border rounded p-3">
            <div className="text-xs opacity-60">Összeg</div>
            <div className="font-medium">{header.grand_total ?? 0} Ft</div>
          </div>
        </div>
      ) : <div className="opacity-60">Betöltés...</div>}

      <div className="border rounded p-3">
        <div className="font-medium mb-2">Tételek</div>
        <div className="text-sm opacity-60">Az MVP-ben az elemeket a /api/workorders/items végponton át lehet felvinni.</div>
      </div>
    </div>
  );
}
