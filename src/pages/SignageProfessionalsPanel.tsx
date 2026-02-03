import React, { useEffect, useState } from "react";
import { Professional, listProfessionals, createProfessional, updateProfessional, deleteProfessional } from "../api/signageProfessionals";

const emptyPro: Partial<Professional> = { name: "", title: "", note: "", photo_url: "", show: true, is_free: true, priority: 0 };

export default function SignageProfessionalsPanel() {
  const [pros, setPros] = useState<Professional[]>([]);
  const [draft, setDraft] = useState<Partial<Professional>>({ ...emptyPro });

  async function refresh() {
    const p = await listProfessionals();
    setPros(p);
  }
  useEffect(() => { refresh(); }, []);

  return (
    <section style={{padding: 12}}>
      <h2>Szakemberek</h2>
      <div style={{color:"#666"}}>Pipa: Megjelenjen + Szabad (zöld/piros)</div>

      <div style={{marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
        <input placeholder="Név" value={draft.name || ""} onChange={(e)=>setDraft(d=>({...d, name:e.target.value}))} />
        <input placeholder="Titulus" value={draft.title || ""} onChange={(e)=>setDraft(d=>({...d, title:e.target.value}))} />
      </div>

      <div style={{marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, alignItems:"center"}}>
        <label><input type="checkbox" checked={Boolean(draft.show)} onChange={(e)=>setDraft(d=>({...d, show:e.target.checked}))} /> Megjelenjen</label>
        <label><input type="checkbox" checked={Boolean(draft.is_free)} onChange={(e)=>setDraft(d=>({...d, is_free:e.target.checked}))} /> Szabad</label>
        <button onClick={async ()=>{ if(!draft.name) return; await createProfessional(draft); setDraft({ ...emptyPro }); refresh(); }}>Hozzáadás</button>
      </div>

      <div style={{marginTop:14}}>
        {pros.map(p=>(
          <div key={p.id} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderTop:"1px solid rgba(0,0,0,0.06)"}}>
            <span style={{width:14,height:14,borderRadius:999,background: p.is_free ? "#2ecc71" : "#e74c3c"}} />
            <b style={{minWidth:180}}>{p.name}</b>
            <span style={{color:"#666"}}>{p.title}</span>

            <label style={{marginLeft:"auto"}}><input type="checkbox" checked={p.show} onChange={async (e)=>{ await updateProfessional(p.id, { show: e.target.checked }); refresh(); }} /> Megjelenjen</label>
            <label><input type="checkbox" checked={p.is_free} onChange={async (e)=>{ await updateProfessional(p.id, { is_free: e.target.checked }); refresh(); }} /> Szabad</label>
            <button onClick={async ()=>{ if(!window.confirm("Törlöd?")) return; await deleteProfessional(p.id); refresh(); }}>Törlés</button>
          </div>
        ))}
      </div>
    </section>
  );
}
