import React, { useEffect, useState } from "react";
import { Professional, listProfessionals, createProfessional, updateProfessional } from "../api/signageProfessionalsIsFree";

const emptyPro: Partial<Professional> = { name: "", title: "", note: "", photo_url: "", show: true, is_free: true, priority: 0 };

export default function ProfessionalsIsFreeAdmin() {
  const [pros, setPros] = useState<Professional[]>([]);
  const [draft, setDraft] = useState<Partial<Professional>>({ ...emptyPro });

  async function refresh() {
    const p = await listProfessionals();
    setPros(p);
  }
  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <h2>Szakemberek (Szabad pipa)</h2>
      <div>
        <input placeholder="Név" value={draft.name || ""} onChange={(e)=>setDraft(d=>({...d, name:e.target.value}))}/>
        <input placeholder="Titulus" value={draft.title || ""} onChange={(e)=>setDraft(d=>({...d, title:e.target.value}))}/>
        <label><input type="checkbox" checked={Boolean(draft.is_free)} onChange={(e)=>setDraft(d=>({...d, is_free:e.target.checked}))}/> Szabad</label>
        <button onClick={async ()=>{ if(!draft.name) return; await createProfessional(draft); setDraft({ ...emptyPro }); refresh(); }}>Hozzáadás</button>
      </div>

      {pros.map(p=>(
        <div key={p.id} style={{display:"flex", gap:12, alignItems:"center", marginTop:10}}>
          <span style={{width:14,height:14,borderRadius:999,background:Boolean(p.is_free)?"#2ecc71":"#e74c3c"}}/>
          <b>{p.name}</b>
        <label><input type="checkbox" checked={Boolean(p.is_free)} onChange={async (e)=>{ await updateProfessional(p.id, { is_free: e.target.checked }); refresh(); }}/> Szabad</label>
        </div>
      ))}
    </div>
  );
}
