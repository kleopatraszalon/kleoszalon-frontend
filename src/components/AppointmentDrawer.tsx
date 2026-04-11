import React, { useEffect, useMemo, useState } from "react";
import "../styles/appointmentDrawer.css";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  appointmentId: string | null;
  initial?: {
    employee_id?: string;
    start_time?: string; // ISO
    end_time?: string;   // ISO
  };
  employees?: Array<{ id: string; full_name?: string; name?: string; role?: string; photo_url?: string; location_id?: string }>;
  onClose: () => void;
  onChanged?: () => void;
};

type DetailResponse = any;

const STATUS = [
  { key: "waiting", label: "Ügyfélre várakozás" },
  { key: "arrived", label: "Ügyfél megérkezett" },
  { key: "no_show", label: "Nem jött el" },
  { key: "confirmed", label: "Ügyfél megerősítette" },
];

function token() {
  try {
    return localStorage.getItem("kleo_token") || localStorage.getItem("token");
  } catch {
    return null;
  }
}
async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const t = token();
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}
function money(v: any) {
  const n = Number(v);
  if (!isFinite(n)) return "";
  return `${Math.round(n).toLocaleString("hu-HU")} Ft`;
}
function hm(d: Date) { return d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" }); }
function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

export default function AppointmentDrawer({ open, mode, appointmentId, initial, employees = [], onClose, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<DetailResponse | null>(null);

  // shared state
  const [status, setStatus] = useState<string>("waiting");

  // create-mode state (1st screenshot)
  const [employeeId, setEmployeeId] = useState<string>(initial?.employee_id || employees[0]?.id || "");
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = initial?.start_time ? new Date(initial.start_time) : new Date();
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState<string>(() => (initial?.start_time ? hm(new Date(initial.start_time)) : "11:45"));
  const [endTime, setEndTime] = useState<string>(() => (initial?.end_time ? hm(new Date(initial.end_time)) : "12:45"));

  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientForOther, setClientForOther] = useState<boolean>(false);

  const [note, setNote] = useState<string>("");

  const [tab, setTab] = useState<"services" | "products">("services");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // edit-mode state (2nd screenshot)
  const [editNotes, setEditNotes] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid");

  const emp = useMemo(() => employees.find((e) => e.id === employeeId) || null, [employees, employeeId]);
  const empName = useMemo(() => emp?.full_name || emp?.name || "Szakember", [emp]);
  const empRole = useMemo(() => emp?.role || "Kozmetikus", [emp]);
  const empPhoto = useMemo(() => emp?.photo_url || "", [emp]);

  // Load detail in edit mode
  useEffect(() => {
    if (!open || mode !== "edit" || !appointmentId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const d = await apiJson<DetailResponse>(`/api/appointments/${appointmentId}/detail`);
        if (!alive) return;
        setData(d);
        setStatus(d?.appointment?.status || "waiting");
        setEditNotes(d?.appointment?.notes || "");
        setPaymentStatus(d?.appointment?.payment_status || "unpaid");
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Betöltési hiba");
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, mode, appointmentId]);

  // Search services/products
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) { setResults([]); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const url = tab === "services" ? `/api/services?query=${encodeURIComponent(q)}` : `/api/products?query=${encodeURIComponent(q)}`;
        const r = await apiJson<any[]>(url);
        if (!alive) return;
        setResults(Array.isArray(r) ? r : []);
      } catch {
        if (!alive) return;
        setResults([]);
      }
    }, 220);
    return () => { alive = false; clearTimeout(t); };
  }, [query, tab, open]);

  const totalCreate = useMemo(() => {
    const s = selectedServices.reduce((a, x) => a + Number(x.price || 0), 0);
    const p = selectedProducts.reduce((a, x) => a + Number(x.price || 0) * Number(x.qty || 1), 0);
    return s + p;
  }, [selectedServices, selectedProducts]);

  const totalEdit = useMemo(() => {
    if (!data) return 0;
    const s = (data.services || []).reduce((a: number, x: any) => a + Number(x.price || 0), 0);
    const p = (data.products || []).reduce((a: number, x: any) => a + Number(x.price || 0) * Number(x.qty || 1), 0);
    return s + p;
  }, [data]);

  function setFromClickInitial() {
    if (!initial?.start_time || !initial?.end_time) return;
    const s = new Date(initial.start_time);
    const e = new Date(initial.end_time);
    setDateStr(s.toISOString().slice(0, 10));
    setStartTime(hm(s));
    setEndTime(hm(e));
  }

  useEffect(() => {
    if (!open || mode !== "create") return;
    setEmployeeId(initial?.employee_id || employees[0]?.id || "");
    setFromClickInitial();
    setStatus("waiting");
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setClientForOther(false);
    setNote("");
    setQuery("");
    setResults([]);
    setSelectedServices([]);
    setSelectedProducts([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  function parseDateTime(dateISO: string, hmStr: string) {
    const [hh, mm] = hmStr.split(":").map((x) => parseInt(x, 10));
    const d = new Date(dateISO + "T00:00:00");
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d;
  }

  async function createEmptyAndItems() {
    setErr("");
    try {
      const s = parseDateTime(dateStr, startTime);
      const e = parseDateTime(dateStr, endTime);

      const location_id =
        (emp as any)?.location_id ||
        (employees.find((x) => (x as any).location_id)?.location_id as any) ||
        null;

      if (!employeeId) throw new Error("Szakember kötelező");
      if (!location_id) throw new Error("Hiányzik a location_id (szalon) az alkalmazottnál.");

      // client handling (optional)
      let client_id: string | null = null;
      if (clientName.trim() || clientPhone.trim() || clientEmail.trim()) {
        const createdClient = await apiJson<any>(`/api/clients`, {
          method: "POST",
          body: JSON.stringify({ full_name: clientName.trim() || null, phone: clientPhone.trim() || null, email: clientEmail.trim() || null }),
        });
        client_id = createdClient?.id || null;
      }

      const created = await apiJson<any>(`/api/appointments`, {
        method: "POST",
        body: JSON.stringify({
          employee_id: employeeId,
          client_id,
          client_name: client_id ? null : (clientName.trim() || null),
          start_time: s.toISOString(),
          end_time: e.toISOString(),
          status,
          notes: note || null,
          location_id,
          for_other_visitor: clientForOther ? true : false,
        }),
      });

      const apptId = String(created?.id || "");
      // add items
      for (const sv of selectedServices) {
        await apiJson(`/api/appointments/${apptId}/services`, { method: "POST", body: JSON.stringify({ service_id: sv.id }) });
      }
      for (const pr of selectedProducts) {
        await apiJson(`/api/appointments/${apptId}/products`, { method: "POST", body: JSON.stringify({ product_id: pr.id, qty: pr.qty || 1 }) });
      }

      onChanged?.();
      // switch to edit view by opening same drawer as edit
      window.dispatchEvent(new CustomEvent("kleo_open_appt", { detail: { id: apptId } }));
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Mentési hiba");
    }
  }

  async function saveEdit() {
    if (!appointmentId) return;
    setErr("");
    try {
      await apiJson(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes: editNotes, payment_status: paymentStatus }),
      });
      onChanged?.();
    } catch (e: any) {
      setErr(e?.message || "Mentési hiba");
    }
  }

  if (!open) return null;

  // Shared header (with employee photo)
  const headerLeft = (
    <div className="ad-clientChip">
      {empPhoto ? (
        <img src={empPhoto} alt={empName} className="ad-avatarimg" />
      ) : (
        <div className="ad-avatar">{initials(empName)}</div>
      )}
      <div>
        <div className="ad-clientName">{empName}</div>
        <div className="ad-clientSub">{empRole}</div>
      </div>
    </div>
  );

  return (
    <div className="ad-overlay" onMouseDown={onClose}>
      <div className="ad-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ad-top">
          {headerLeft}
          <div className="ad-topRight"><button className="ad-iconBtn" onClick={onClose}>✕</button></div>
        </div>

        {err ? <div className="ad-err ad-pad">{err}</div> : null}
        {loading ? <div className="ad-pad">Betöltés…</div> : null}

        {mode === "create" ? (
          <div className="ad-cols">
            {/* LEFT - specialist + date/time + note */}
            <div className="ad-col">
              <div className="ad-card">
                <div className="ad-cardTitle">Szakember</div>
                <select className="ad-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name || e.name || e.id}</option>
                  ))}
                </select>

                <div style={{ height: 10 }} />
                <div className="ad-cardTitle">Dátum</div>
                <input className="ad-select" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />

                <div style={{ height: 10 }} />
                <div className="ad-cardTitle">A bejegyzés ideje és időtartama</div>
                <div className="ad-row2">
                  <input className="ad-select" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="11:45" />
                  <input className="ad-select" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="12:45" />
                </div>
                <div style={{ height: 10 }} />
                <button className="ad-tile small">+ Szünet hozzáadása</button>
              </div>

              <div className="ad-card">
                <div className="ad-cardTitle">Rögzített mezők</div>
                <div className="ad-muted">Megjegyzések a bejegyzéshez</div>
                <textarea className="ad-textarea" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="ad-tiles">
                <button className="ad-tile">Speciális mezők</button>
                <button className="ad-tile">Időpont megismétlése</button>
                <button className="ad-tile">Időpont-értesítések</button>
              </div>
            </div>

            {/* MIDDLE - status + services/products pick */}
            <div className="ad-col">
              <div className="ad-statusRow">
                {STATUS.map((s) => (
                  <button key={s.key} className={`ad-statusBtn ${status === s.key ? "isActive" : ""}`} onClick={() => setStatus(s.key)}>
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="ad-card">
                <div className="ad-tabs">
                  <button className={`ad-tab ${tab === "services" ? "isActive" : ""}`} onClick={() => setTab("services")}>Szolgáltatások</button>
                  <button className={`ad-tab ${tab === "products" ? "isActive" : ""}`} onClick={() => setTab("products")}>Termékek</button>
                </div>

                <input className="ad-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "services" ? "Keresés szolgáltatások szerint" : "Keresés termékek szerint"} />

                <div className="ad-resultsGrid">
                  {results.slice(0, 6).map((r) => (
                    <button key={r.id} className="ad-cardPick" onClick={() => {
                      if (tab === "services") setSelectedServices((p) => [...p, r]);
                      else setSelectedProducts((p) => [...p, { ...r, qty: 1 }]);
                    }}>
                      <div className="ad-pickTitle">{r.name}</div>
                      <div className="ad-pickSub">{money(r.price)} {r.duration_minutes ? `· ${r.duration_minutes} min.` : ""}</div>
                    </button>
                  ))}
                </div>

                <div style={{ height: 10 }} />
                <div className="ad-muted">Fizetendő összeg</div>
                <div className="ad-total">{money(totalCreate)}</div>
              </div>

              <div className="ad-saveRow">
                <button className="ad-saveBtn" onClick={createEmptyAndItems}>Üres bejegyzés mentése</button>
              </div>
            </div>

            {/* RIGHT - client form + previous clients */}
            <div className="ad-col">
              <div className="ad-card">
                <div className="ad-cardTitle">Név</div>
                <input className="ad-search" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="John" />
                <div className="ad-cardTitle" style={{ marginTop: 10 }}>Telefonszám</div>
                <input className="ad-search" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+36 00 000 0000" />
                <div className="ad-cardTitle" style={{ marginTop: 10 }}>E-mail</div>
                <input className="ad-search" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="pelda@mail.hu" />

                <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, fontWeight: 800, fontSize: 12 }}>
                  <input type="checkbox" checked={clientForOther} onChange={(e) => setClientForOther(e.target.checked)} />
                  Bejegyzés egy másik látogató számára
                </label>

                <div className="ad-cardTitle" style={{ marginTop: 14 }}>Korábbi ügyfelek</div>
                <div className="ad-prevList">
                  {/* you can wire this to /api/clients?query later; for now empty */}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // EDIT MODE (2nd screenshot)
          <div className="ad-cols">
            <div className="ad-col">
              <div className="ad-card">
                <div className="ad-clientChip" style={{ background: "#f3f4f6" }}>
                  {empPhoto ? <img src={empPhoto} alt={empName} className="ad-avatarimg" /> : <div className="ad-avatar">{initials(empName)}</div>}
                  <div>
                    <div className="ad-clientName">{empName}</div>
                    <div className="ad-clientSub">{empRole}</div>
                    {data?.appointment?.start_time ? (
                      <div className="ad-muted" style={{ marginTop: 6 }}>
                        {new Date(data.appointment.start_time).toLocaleDateString("hu-HU")} · {hm(new Date(data.appointment.start_time))}-{hm(new Date(data.appointment.end_time))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <button className="ad-linkBtn">✎ Módosítás</button>
              </div>

              <div className="ad-card">
                <div className="ad-cardTitle">Rögzített mezők</div>
                <div className="ad-muted">Megjegyzések az időponthoz</div>
                <textarea className="ad-textarea" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </div>

              <div className="ad-tiles">
                <button className="ad-tile">Speciális mezők</button>
                <button className="ad-tile">Időpont megismétlése</button>
                <button className="ad-tile">Időpont-értesítések</button>
                <button className="ad-tile">Felhasznált alapanyagok</button>
                <button className="ad-tile">Módosítási előzmények</button>
              </div>
            </div>

            <div className="ad-col">
              <div className="ad-statusRow">
                {STATUS.map((s) => (
                  <button key={s.key} className={`ad-statusBtn ${status === s.key ? "isActive" : ""}`} onClick={() => setStatus(s.key)}>
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="ad-card">
                {/* Items list */}
                <div className="ad-items">
                  {(data?.services || []).map((it: any) => (
                    <div key={it.id} className="ad-item">
                      <div className="ad-itemMain">
                        <div className="ad-itemName">{it.name}</div>
                        <div className="ad-itemSub">{it.duration_minutes ? `${it.duration_minutes} min.` : ""}</div>
                      </div>
                      <div className="ad-itemRight">
                        <div className="ad-itemPrice">{money(it.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ad-payRow">
                  <div>
                    <div className="ad-muted">Fizetendő összeg</div>
                    <div className="ad-total">{money(totalEdit)}</div>
                  </div>
                  <button className="ad-tile small">Fizetés</button>
                </div>

                <div className="ad-tabs">
                  <button className={`ad-tab ${tab === "services" ? "isActive" : ""}`} onClick={() => setTab("services")}>Szolgáltatások</button>
                  <button className={`ad-tab ${tab === "products" ? "isActive" : ""}`} onClick={() => setTab("products")}>Termékek</button>
                </div>

                <input className="ad-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Keresés szolgáltatások szerint" />

                <div className="ad-resultsGrid">
                  {results.slice(0, 6).map((r) => (
                    <button key={r.id} className="ad-cardPick" onClick={() => { /* wire add item later */ }}>
                      <div className="ad-pickTitle">{r.name}</div>
                      <div className="ad-pickSub">{money(r.price)} {r.duration_minutes ? `· ${r.duration_minutes} min.` : ""}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ad-saveRow">
                <button className="ad-saveBtn" onClick={saveEdit}>Változások mentése</button>
                <select className="ad-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="unpaid">Nincs fizetve</option>
                  <option value="paid">Teljesen kifizetve</option>
                  <option value="partial">Részben fizetve</option>
                </select>
              </div>
            </div>

            <div className="ad-col">
              <div className="ad-card">
                <div className="ad-rightTop">
                  <div className="ad-rightClient">
                    <div className="ad-avatar small">{initials(data?.client?.full_name || data?.client?.name || "Ü")}</div>
                    <div>
                      <div className="ad-clientName">{data?.client?.full_name || data?.client?.name || "Ügyfél"}</div>
                      <div className="ad-clientSub">{data?.client?.phone || ""}</div>
                    </div>
                  </div>
                  <button className="ad-linkBtn">✎ Módosítás</button>
                </div>

                <button className="ad-whatsapp">CSEVEGÉS WHATSAPP-ON</button>

                <div className="ad-rightBtns">
                  <button className="ad-tile small">Ügyfélprofil</button>
                  <button className="ad-tile small">Látogatási előzmények</button>
                  <button className="ad-tile small">További</button>
                </div>

                <div className="ad-section">
                  <div className="ad-cardTitle">Hálózat adatai</div>
                  <div className="ad-kv">
                    <div>Utolsó látogatás</div>
                    <div>{data?.client_summary?.last_visit ? new Date(data.client_summary.last_visit).toLocaleString("hu-HU") : "—"}</div>
                    <div>Összes látogatás</div>
                    <div>{data?.client_summary?.visits_total ?? 0}</div>
                    <div>Nem jött el</div>
                    <div>{data?.client_summary?.no_show_count ?? 0}</div>
                    <div>Egyenleg</div>
                    <div>{money(data?.client_summary?.balance ?? 0)}</div>
                  </div>
                </div>

                <div className="ad-section">
                  <div className="ad-cardTitle">Időpont részletek</div>
                  <div className="ad-muted">Létrehozás: {data?.appointment?.created_at ? new Date(data.appointment.created_at).toLocaleString("hu-HU") : "—"}</div>
                  <div className="ad-muted">Forrás: {data?.appointment?.source_channel || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
