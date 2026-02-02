import React, { useEffect, useMemo, useState } from "react";
import {
  createDeal,
  createProfessional,
  createQuote,
  deleteDeal,
  deleteProfessional,
  deleteQuote,
  listDeals,
  listProfessionals,
  listQuotes,
  listServices,
  upsertServiceOverride,
  updateDeal,
  updateProfessional,
  updateQuote,
  Deal,
  Professional,
  Quote,
  ServiceItem,
} from "../api/signageAdmin";
import "./SignageAdmin.css";

const emptyDeal: Partial<Deal> = {
  title: "",
  subtitle: "",
  price_text: "",
  valid_from: null,
  valid_to: null,
  active: true,
  priority: 0,
};
const emptyPro: Partial<Professional> = { name: "", title: "", note: "", available: true, priority: 0 };
const emptyQuote: Partial<Quote> = { category: "fitness", text: "", author: "", active: true, priority: 0 };

export default function SignageAdminPage() {
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const [svcFilter, setSvcFilter] = useState("");
  const [dealDraft, setDealDraft] = useState<Partial<Deal>>({ ...emptyDeal });
  const [proDraft, setProDraft] = useState<Partial<Professional>>({ ...emptyPro });
  const [quoteDraft, setQuoteDraft] = useState<Partial<Quote>>({ ...emptyQuote });

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const [s, d, p, q] = await Promise.all([listServices(), listDeals(), listProfessionals(), listQuotes()]);
      setServices(s);
      setDeals(d);
      setPros(p);
      setQuotes(q);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filteredServices = useMemo(() => {
    const f = svcFilter.trim().toLowerCase();
    if (!f) return services;
    return services.filter(s => (s.name || "").toLowerCase().includes(f) || (s.category || "").toLowerCase().includes(f));
  }, [services, svcFilter]);

  return (
    <div className="sgadm">
      <div className="sgadm__top">
        <div>
          <h1>Kijelző admin</h1>
          <div className="sgadm__sub">Bárki módosíthatja (nyitott mód) – akciók, szolgáltatások, szakemberek, idézetek</div>
        </div>
        <div className="sgadm__actions">
          <button onClick={refresh} disabled={loading}>{loading ? "Frissítés..." : "Frissítés"}</button>
        </div>
      </div>

      {err && <div className="sgadm__err">Hiba: {err}</div>}

      <div className="sgadm__grid">
        <section className="card">
          <h2>Szolgáltatások – kijelző</h2>
          <div className="muted">Megjelenés, kijelző ár, sorrend</div>

          <div className="row">
            <input value={svcFilter} onChange={(e)=>setSvcFilter(e.target.value)} placeholder="Keresés..." />
          </div>

          <div className="list">
            {filteredServices.map(s => (
              <div className="item" key={s.id}>
                <div className="item__title">
                  <b>{s.name}</b>
                  <span className={`badge ${s.enabled ? "ok" : "off"}`}>{s.enabled ? "LÁTHATÓ" : "REJTETT"}</span>
                </div>
                <div className="muted">{s.category}</div>

                <div className="grid3">
                  <div>
                    <label>Kijelző ár (override)</label>
                    <input
                      defaultValue={s.price_text}
                      onBlur={async (e) => { try { await upsertServiceOverride(s.id, { price_text_override: e.target.value }); refresh(); } catch (er:any){ setErr(String(er?.message||er)); } }}
                      placeholder="pl. 9 990 Ft-tól"
                    />
                  </div>
                  <div>
                    <label>Prioritás</label>
                    <input
                      type="number"
                      defaultValue={s.priority ?? 0}
                      onBlur={async (e) => { try { await upsertServiceOverride(s.id, { priority: Number(e.target.value) }); refresh(); } catch (er:any){ setErr(String(er?.message||er)); } }}
                    />
                  </div>
                  <div className="btncol">
                    <label>&nbsp;</label>
                    <button
                      className="secondary"
                      onClick={async () => { try { await upsertServiceOverride(s.id, { enabled: !s.enabled }); refresh(); } catch (er:any){ setErr(String(er?.message||er)); } }}
                    >
                      {s.enabled ? "Elrejt" : "Megjelenít"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!filteredServices.length && <div className="muted">Nincs találat.</div>}
          </div>
        </section>

        <section className="card">
          <h2>Napi akciók</h2>
          <div className="muted">A kijelző fixen 4 ajánlatot mutat (top 4 prioritás szerint).</div>

          <div className="form">
            <div className="grid2">
              <div>
                <label>Cím</label>
                <input value={dealDraft.title || ""} onChange={(e)=>setDealDraft(d=>({...d, title:e.target.value}))} />
              </div>
              <div>
                <label>Ár / kedvezmény</label>
                <input value={dealDraft.price_text || ""} onChange={(e)=>setDealDraft(d=>({...d, price_text:e.target.value}))} />
              </div>
            </div>
            <div>
              <label>Alcím</label>
              <input value={dealDraft.subtitle || ""} onChange={(e)=>setDealDraft(d=>({...d, subtitle:e.target.value}))} />
            </div>
            <div className="grid3">
              <div>
                <label>Érvényes -tól</label>
                <input value={dealDraft.valid_from || ""} onChange={(e)=>setDealDraft(d=>({...d, valid_from: e.target.value || null}))} placeholder="YYYY-MM-DD" />
              </div>
              <div>
                <label>Érvényes -ig</label>
                <input value={dealDraft.valid_to || ""} onChange={(e)=>setDealDraft(d=>({...d, valid_to: e.target.value || null}))} placeholder="YYYY-MM-DD" />
              </div>
              <div>
                <label>Prioritás</label>
                <input type="number" value={dealDraft.priority ?? 0} onChange={(e)=>setDealDraft(d=>({...d, priority: Number(e.target.value)}))} />
              </div>
            </div>
            <div className="grid2">
              <label className="chk">
                <input type="checkbox" checked={Boolean(dealDraft.active)} onChange={(e)=>setDealDraft(d=>({...d, active: e.target.checked}))} />
                Aktív
              </label>
              <button onClick={async () => {
                try {
                  if (!dealDraft.title) return alert("Cím kötelező.");
                  await createDeal(dealDraft);
                  setDealDraft({ ...emptyDeal });
                  refresh();
                } catch (e: any) { setErr(String(e?.message || e)); }
              }}>Hozzáadás</button>
            </div>
          </div>

          <div className="list">
            {deals.map(d => (
              <div className="item" key={d.id}>
                <div className="item__title">
                  <b>{d.title}</b>
                  <span className={`badge ${d.active ? "ok" : "off"}`}>{d.active ? "AKTÍV" : "INAKTÍV"}</span>
                </div>
                <div className="muted">{d.subtitle}</div>
                <div className="price">{d.price_text}</div>
                <div className="muted">Érv.: {d.valid_from || "—"} – {d.valid_to || "—"} • prio: {d.priority}</div>
                <div className="btnrow">
                  <button className="secondary" onClick={async () => { await updateDeal(d.id, { active: !d.active }); refresh(); }}>
                    {d.active ? "Kikapcs" : "Aktivál"}
                  </button>
                  <button className="danger" onClick={async () => { if (!window.confirm("Törlöd?")) return; await deleteDeal(d.id); refresh(); }}>
                    Törlés
                  </button>
                </div>
              </div>
            ))}
            {!deals.length && <div className="muted">Nincs akció.</div>}
          </div>
        </section>

        <section className="card">
          <h2>Elérhető szakemberek</h2>
          <div className="muted">A kijelző a available=true szakembereket listázza.</div>

          <div className="form">
            <div className="grid2">
              <div>
                <label>Név</label>
                <input value={proDraft.name || ""} onChange={(e)=>setProDraft(p=>({...p, name:e.target.value}))} />
              </div>
              <div>
                <label>Titulus</label>
                <input value={proDraft.title || ""} onChange={(e)=>setProDraft(p=>({...p, title:e.target.value}))} placeholder="pl. kozmetikus" />
              </div>
            </div>
            <div>
              <label>Megjegyzés</label>
              <input value={proDraft.note || ""} onChange={(e)=>setProDraft(p=>({...p, note:e.target.value}))} placeholder="pl. ma 12–18" />
            </div>
            <div className="grid3">
              <label className="chk">
                <input type="checkbox" checked={Boolean(proDraft.available)} onChange={(e)=>setProDraft(p=>({...p, available:e.target.checked}))} />
                Elérhető
              </label>
              <div>
                <label>Prioritás</label>
                <input type="number" value={proDraft.priority ?? 0} onChange={(e)=>setProDraft(p=>({...p, priority: Number(e.target.value)}))} />
              </div>
              <button onClick={async () => {
                try {
                  if (!proDraft.name) return alert("Név kötelező.");
                  await createProfessional(proDraft);
                  setProDraft({ ...emptyPro });
                  refresh();
                } catch (e: any) { setErr(String(e?.message || e)); }
              }}>Hozzáadás</button>
            </div>
          </div>

          <div className="list">
            {pros.map(p => (
              <div className="item" key={p.id}>
                <div className="item__title">
                  <b>{p.name}</b>
                  <span className={`badge ${p.available ? "ok" : "off"}`}>{p.available ? "ELÉRHETŐ" : "FOGLALT"}</span>
                </div>
                <div className="muted">{p.title}</div>
                <div className="muted">{p.note}</div>
                <div className="btnrow">
                  <button className="secondary" onClick={async () => { await updateProfessional(p.id, { available: !p.available }); refresh(); }}>
                    {p.available ? "Foglaltra" : "Elérhetőre"}
                  </button>
                  <button className="danger" onClick={async () => { if (!window.confirm("Törlöd?")) return; await deleteProfessional(p.id); refresh(); }}>
                    Törlés
                  </button>
                </div>
              </div>
            ))}
            {!pros.length && <div className="muted">Nincs szakember.</div>}
          </div>
        </section>

        <section className="card">
          <h2>Idézetek</h2>
          <div className="muted">fitness / beauty / general</div>

          <div className="form">
            <div className="grid2">
              <div>
                <label>Kategória</label>
                <select value={quoteDraft.category as any} onChange={(e)=>setQuoteDraft(q=>({...q, category: e.target.value as any}))}>
                  <option value="fitness">fitness</option>
                  <option value="beauty">beauty</option>
                  <option value="general">general</option>
                </select>
              </div>
              <div>
                <label>Szerző</label>
                <input value={quoteDraft.author || ""} onChange={(e)=>setQuoteDraft(q=>({...q, author:e.target.value}))} />
              </div>
            </div>
            <div>
              <label>Szöveg</label>
              <textarea rows={3} value={quoteDraft.text || ""} onChange={(e)=>setQuoteDraft(q=>({...q, text:e.target.value}))} />
            </div>
            <div className="grid3">
              <label className="chk">
                <input type="checkbox" checked={Boolean(quoteDraft.active)} onChange={(e)=>setQuoteDraft(q=>({...q, active:e.target.checked}))} />
                Aktív
              </label>
              <div>
                <label>Prioritás</label>
                <input type="number" value={quoteDraft.priority ?? 0} onChange={(e)=>setQuoteDraft(q=>({...q, priority:Number(e.target.value)}))} />
              </div>
              <button onClick={async () => {
                try {
                  if (!quoteDraft.text) return alert("Szöveg kötelező.");
                  await createQuote(quoteDraft);
                  setQuoteDraft({ ...emptyQuote });
                  refresh();
                } catch (e: any) { setErr(String(e?.message || e)); }
              }}>Hozzáadás</button>
            </div>
          </div>

          <div className="list">
            {quotes.map(q => (
              <div className="item" key={q.id}>
                <div className="item__title">
                  <b>{q.category.toUpperCase()}</b>
                  <span className={`badge ${q.active ? "ok" : "off"}`}>{q.active ? "AKTÍV" : "INAKTÍV"}</span>
                </div>
                <div className="muted">{q.text}</div>
                {q.author ? <div className="muted">— {q.author}</div> : null}
                <div className="btnrow">
                  <button className="secondary" onClick={async () => { await updateQuote(q.id, { active: !q.active }); refresh(); }}>
                    {q.active ? "Kikapcs" : "Aktivál"}
                  </button>
                  <button className="danger" onClick={async () => { if (!window.confirm("Törlöd?")) return; await deleteQuote(q.id); refresh(); }}>
                    Törlés
                  </button>
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
