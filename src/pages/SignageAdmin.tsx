import React, { useEffect, useState } from "react";
import logo from "../logo.svg";
import {
  SignageService,
  Deal,
  Professional,
  VideoItem,
  Quote,
  listSignageServices,
  createSignageService,
  updateSignageService,
  deleteSignageService,
  listDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  listProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  listQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
} from "../api/signageAdmin";
import "./SignageAdmin.css";

const emptyService: Partial<SignageService> = { name: "", category: "", duration_min: null, price_text: "", show: true, priority: 0 };
const emptyDeal: Partial<Deal> = { title: "", subtitle: "", price_text: "", valid_from: null, valid_to: null, active: true, priority: 0 };
const emptyPro: Partial<Professional> = { name: "", title: "", note: "", photo_url: "", show: true, available: true, priority: 0 };
const emptyVideo: Partial<VideoItem> = { youtube_id: "", title: "", enabled: true, priority: 0, duration_sec: 60 };
const emptyQuote: Partial<Quote> = { category: "fitness", text: "", author: "", active: true, priority: 0 };

function extractYoutubeId(input: string) {
  const raw = String(input || "").trim();
  const m = raw.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : raw;
}

export default function SignageAdmin() {
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [services, setServices] = useState<SignageService[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const [serviceDraft, setServiceDraft] = useState<Partial<SignageService>>({ ...emptyService });
  const [dealDraft, setDealDraft] = useState<Partial<Deal>>({ ...emptyDeal });
  const [proDraft, setProDraft] = useState<Partial<Professional>>({ ...emptyPro });
  const [videoDraft, setVideoDraft] = useState<Partial<VideoItem>>({ ...emptyVideo });
  const [quoteDraft, setQuoteDraft] = useState<Partial<Quote>>({ ...emptyQuote });

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const [s, d, p, v, q] = await Promise.all([
        listSignageServices(),
        listDeals(),
        listProfessionals(),
        listVideos(),
        listQuotes(),
      ]);
      setServices(s);
      setDeals(d);
      setPros(p);
      setVideos(v);
      setQuotes(q);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="sgadm">
      <div className="sgadm__top">
        <div className="sgadm__brand">
          <img className="sgadm__logo" src={logo} alt="KLEO" />
          <div>
            <h1>Kijelző admin</h1>
            <div className="sgadm__sub">
              404 javítva: nem lesz több <b>/api/api/...</b> • Most már van Napi akciók + Szakemberek + Idézetek admin is.
            </div>
          </div>
        </div>
        <div className="sgadm__actions">
          <button onClick={refresh} disabled={loading}>{loading ? "Frissítés..." : "Frissítés"}</button>
        </div>
      </div>

      {err && <div className="sgadm__err">Hiba: {err}</div>}

      <div className="sgadm__gridWide">
        {/* SERVICES */}
        <section className="card">
          <h2>Szolgáltatások</h2>
          <div className="muted">Lista + pipa (Megjelenjen) + törlés</div>

          <div className="form">
            <div className="grid2">
              <div><label>Név</label><input value={serviceDraft.name || ""} onChange={(e)=>setServiceDraft(s=>({...s, name:e.target.value}))} /></div>
              <div><label>Kategória</label><input value={serviceDraft.category || ""} onChange={(e)=>setServiceDraft(s=>({...s, category:e.target.value}))} /></div>
            </div>
            <div className="grid3">
              <div><label>Idő (perc)</label><input type="number" value={(serviceDraft.duration_min ?? "") as any} onChange={(e)=>setServiceDraft(s=>({...s, duration_min: e.target.value==="" ? null : Number(e.target.value)}))} /></div>
              <div><label>Ár</label><input value={serviceDraft.price_text || ""} onChange={(e)=>setServiceDraft(s=>({...s, price_text:e.target.value}))} /></div>
              <div><label>Prioritás</label><input type="number" value={serviceDraft.priority ?? 0} onChange={(e)=>setServiceDraft(s=>({...s, priority:Number(e.target.value)}))} /></div>
            </div>
            <div className="grid2">
              <label className="chk"><input type="checkbox" checked={Boolean(serviceDraft.show)} onChange={(e)=>setServiceDraft(s=>({...s, show:e.target.checked}))} />Megjelenjen</label>
              <button onClick={async ()=>{ 
                try{
                  if(!serviceDraft.name) return alert("Név kötelező.");
                  await createSignageService(serviceDraft);
                  setServiceDraft({ ...emptyService });
                  refresh();
                } catch(e:any){ setErr(String(e?.message||e)); }
              }}>Hozzáadás</button>
            </div>
          </div>

          <div className="list">
            {services.map(s=>(
              <div className="item" key={s.id}>
                <div className="item__title">
                  <b>{s.name}</b>
                  <label className="chkSmall">
                    <input type="checkbox" checked={!!s.show} onChange={async (e)=>{ await updateSignageService(s.id, { show: e.target.checked }); refresh(); }} />
                    Megjelenjen
                  </label>
                </div>
                <div className="muted">{s.category}</div>
                <div className="price">{s.price_text}</div>
                <div className="btnrow">
                  <button className="danger" onClick={async ()=>{ if(!window.confirm("Törlöd?")) return; await deleteSignageService(s.id); refresh(); }}>Törlés</button>
                </div>
              </div>
            ))}
            {!services.length && <div className="muted">Nincs szolgáltatás.</div>}
          </div>
        </section>

        {/* VIDEOS */}
        <section className="card">
          <h2>YouTube videók</h2>
          <div className="muted">Lista + pipa (Megjelenjen) + váltás + törlés</div>

          <div className="form">
            <div className="grid2">
              <div><label>Link vagy ID</label><input value={videoDraft.youtube_id || ""} onChange={(e)=>setVideoDraft(v=>({...v, youtube_id:e.target.value}))} /></div>
              <div><label>Cím</label><input value={videoDraft.title || ""} onChange={(e)=>setVideoDraft(v=>({...v, title:e.target.value}))} /></div>
            </div>
            <div className="grid3">
              <label className="chk"><input type="checkbox" checked={Boolean(videoDraft.enabled)} onChange={(e)=>setVideoDraft(v=>({...v, enabled:e.target.checked}))} />Megjelenjen</label>
              <div><label>Váltás (mp)</label><input type="number" value={videoDraft.duration_sec ?? 60} onChange={(e)=>setVideoDraft(v=>({...v, duration_sec:Number(e.target.value)}))} /></div>
              <button onClick={async ()=>{ 
                try{
                  if(!videoDraft.youtube_id) return alert("YouTube ID kötelező.");
                  const youtube_id = extractYoutubeId(String(videoDraft.youtube_id));
                  await createVideo({ ...videoDraft, youtube_id });
                  setVideoDraft({ ...emptyVideo });
                  refresh();
                } catch(e:any){ setErr(String(e?.message||e)); }
              }}>Hozzáadás</button>
            </div>
          </div>

          <div className="list">
            {videos.map(v=>(
              <div className="item" key={v.id}>
                <div className="item__title">
                  <b>{v.youtube_id}</b>
                  <label className="chkSmall">
                    <input type="checkbox" checked={!!v.enabled} onChange={async (e)=>{ await updateVideo(v.id, { enabled: e.target.checked }); refresh(); }} />
                    Megjelenjen
                  </label>
                </div>
                <div className="muted">{v.title}</div>
                <div className="muted">Váltás: {v.duration_sec}s</div>
                <div className="btnrow">
                  <button className="danger" onClick={async ()=>{ if(!window.confirm("Törlöd?")) return; await deleteVideo(v.id); refresh(); }}>Törlés</button>
                </div>
              </div>
            ))}
            {!videos.length && <div className="muted">Nincs videó.</div>}
          </div>
        </section>

        {/* DEALS */}
        <section className="card">
          <h2>Napi akciók</h2>
          <div className="muted">Lista + pipa (Megjelenjen) + törlés</div>

          <div className="form">
            <div className="grid2">
              <div><label>Cím</label><input value={dealDraft.title || ""} onChange={(e)=>setDealDraft(d=>({...d, title:e.target.value}))} /></div>
              <div><label>Ár</label><input value={dealDraft.price_text || ""} onChange={(e)=>setDealDraft(d=>({...d, price_text:e.target.value}))} /></div>
            </div>
            <div><label>Alcím</label><input value={dealDraft.subtitle || ""} onChange={(e)=>setDealDraft(d=>({...d, subtitle:e.target.value}))} /></div>
            <div className="grid3">
              <div><label>Érvényes -tól</label><input value={dealDraft.valid_from || ""} onChange={(e)=>setDealDraft(d=>({...d, valid_from: e.target.value || null}))} placeholder="YYYY-MM-DD" /></div>
              <div><label>Érvényes -ig</label><input value={dealDraft.valid_to || ""} onChange={(e)=>setDealDraft(d=>({...d, valid_to: e.target.value || null}))} placeholder="YYYY-MM-DD" /></div>
              <div><label>Prioritás</label><input type="number" value={dealDraft.priority ?? 0} onChange={(e)=>setDealDraft(d=>({...d, priority:Number(e.target.value)}))} /></div>
            </div>
            <div className="grid2">
              <label className="chk"><input type="checkbox" checked={Boolean(dealDraft.active)} onChange={(e)=>setDealDraft(d=>({...d, active:e.target.checked}))} />Megjelenjen</label>
              <button onClick={async ()=>{ 
                try{
                  if(!dealDraft.title) return alert("Cím kötelező.");
                  await createDeal(dealDraft);
                  setDealDraft({ ...emptyDeal });
                  refresh();
                } catch(e:any){ setErr(String(e?.message||e)); }
              }}>Hozzáadás</button>
            </div>
          </div>

          <div className="list">
            {deals.map(d=>(
              <div className="item" key={d.id}>
                <div className="item__title">
                  <b>{d.title}</b>
                  <label className="chkSmall">
                    <input type="checkbox" checked={!!d.active} onChange={async (e)=>{ await updateDeal(d.id, { active: e.target.checked }); refresh(); }} />
                    Megjelenjen
                  </label>
                </div>
                <div className="muted">{d.subtitle}</div>
                <div className="price">{d.price_text}</div>
                <div className="btnrow">
                  <button className="danger" onClick={async ()=>{ if(!window.confirm("Törlöd?")) return; await deleteDeal(d.id); refresh(); }}>Törlés</button>
                </div>
              </div>
            ))}
            {!deals.length && <div className="muted">Nincs akció.</div>}
          </div>
        </section>

        {/* PROFESSIONALS */}
        <section className="card">
          <h2>Szakemberek</h2>
          <div className="muted">Lista + pipa (Megjelenjen / Elérhető) + törlés</div>

          <div className="form">
            <div className="grid2">
              <div><label>Név</label><input value={proDraft.name || ""} onChange={(e)=>setProDraft(p=>({...p, name:e.target.value}))} /></div>
              <div><label>Titulus</label><input value={proDraft.title || ""} onChange={(e)=>setProDraft(p=>({...p, title:e.target.value}))} /></div>
            </div>
            <div><label>Megjegyzés</label><input value={proDraft.note || ""} onChange={(e)=>setProDraft(p=>({...p, note:e.target.value}))} /></div>
            <div className="grid3">
              <label className="chk"><input type="checkbox" checked={Boolean(proDraft.available)} onChange={(e)=>setProDraft(p=>({...p, available:e.target.checked}))} />Elérhető</label>
              <div><label>Prioritás</label><input type="number" value={proDraft.priority ?? 0} onChange={(e)=>setProDraft(p=>({...p, priority:Number(e.target.value)}))} /></div>
              <button onClick={async ()=>{ 
                try{
                  if(!proDraft.name) return alert("Név kötelező.");
                  await createProfessional(proDraft);
                  setProDraft({ ...emptyPro });
                  refresh();
                } catch(e:any){ setErr(String(e?.message||e)); }
              }}>Hozzáadás</button>
            </div>
          </div>

          <div className="list">
            {pros.map(p=>(
              <div className="item" key={p.id}>
                <div className="item__title">
                  <b>{p.name}</b>
                  <div className="inlineToggles">
                    <label className="chkSmall">
                      <input type="checkbox" checked={!!p.show} onChange={async (e)=>{ await updateProfessional(p.id, { show: e.target.checked }); refresh(); }} />
                      Megjelenjen
                    </label>
                    <label className="chkSmall">
                      <input type="checkbox" checked={!!p.available} onChange={async (e)=>{ await updateProfessional(p.id, { available: e.target.checked }); refresh(); }} />
                      Elérhető
                    </label>
                  </div>
                </div>
                <div className="muted">{p.title}</div>
                <div className="btnrow">
                  <button className="danger" onClick={async ()=>{ if(!window.confirm("Törlöd?")) return; await deleteProfessional(p.id); refresh(); }}>Törlés</button>
                </div>
              </div>
            ))}
            {!pros.length && <div className="muted">Nincs szakember.</div>}
          </div>
        </section>

        {/* QUOTES */}
        <section className="card">
          <h2>Idézetek</h2>
          <div className="muted">Lista + pipa (Megjelenjen) + törlés</div>

          <div className="form">
            <div className="grid2">
              <div>
                <label>Kategória</label>
                <select value={quoteDraft.category as any} onChange={(e)=>setQuoteDraft(q=>({...q, category:e.target.value as any}))}>
                  <option value="fitness">fitness</option>
                  <option value="beauty">beauty</option>
                  <option value="general">general</option>
                </select>
              </div>
              <div><label>Szerző</label><input value={quoteDraft.author || ""} onChange={(e)=>setQuoteDraft(q=>({...q, author:e.target.value}))} /></div>
            </div>
            <div><label>Szöveg</label><textarea rows={3} value={quoteDraft.text || ""} onChange={(e)=>setQuoteDraft(q=>({...q, text:e.target.value}))} /></div>
            <div className="grid3">
              <label className="chk"><input type="checkbox" checked={Boolean(quoteDraft.active)} onChange={(e)=>setQuoteDraft(q=>({...q, active:e.target.checked}))} />Megjelenjen</label>
              <div><label>Prioritás</label><input type="number" value={quoteDraft.priority ?? 0} onChange={(e)=>setQuoteDraft(q=>({...q, priority:Number(e.target.value)}))} /></div>
              <button onClick={async ()=>{ 
                try{
                  if(!quoteDraft.text) return alert("Szöveg kötelező.");
                  await createQuote(quoteDraft);
                  setQuoteDraft({ ...emptyQuote });
                  refresh();
                } catch(e:any){ setErr(String(e?.message||e)); }
              }}>Hozzáadás</button>
            </div>
          </div>

          <div className="list">
            {quotes.map(q=>(
              <div className="item" key={q.id}>
                <div className="item__title">
                  <b>{q.category.toUpperCase()}</b>
                  <label className="chkSmall">
                    <input type="checkbox" checked={!!q.active} onChange={async (e)=>{ await updateQuote(q.id, { active: e.target.checked }); refresh(); }} />
                    Megjelenjen
                  </label>
                </div>
                <div className="muted">{q.text}</div>
                <div className="btnrow">
                  <button className="danger" onClick={async ()=>{ if(!window.confirm("Törlöd?")) return; await deleteQuote(q.id); refresh(); }}>Törlés</button>
                </div>
              </div>
            ))}
            {!quotes.length && <div className="muted">Nincs idézet.</div>}
          </div>
        </section>

      </div>
    </div>
  );
}
