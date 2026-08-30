import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Cloud, RefreshCw, RotateCcw, Save, ShieldCheck, Wifi } from "lucide-react";
import api from "../api/api";
import "./SecuritySettingsPage.css";

type PolicyName = "login" | "booking" | "api";
type Policy = { enabled: boolean; max: number; windowMs: number };
type Payload = {
  policies: Record<PolicyName, Policy>;
  defaults: Record<PolicyName, Policy>;
  persistence: { type: string; limiter_store: string; warning?: string; updated_at?: string | null; updated_by?: string | null };
  cloudflare: { api_token_configured: boolean; zone_id_configured: boolean; headers_detected: boolean; cf_ray?: string | null; connecting_ip_present: boolean; note?: string };
  proxy: { express_trust_proxy_expected: number; request_ip?: string; x_forwarded_for?: string | null; cf_connecting_ip?: string | null; forwarded_chain_length: number };
};

const labels: Record<PolicyName, { title: string; description: string }> = {
  login: { title: "Bejelentkezés", description: "Brute-force és jelszópróbálgatás elleni védelem IP-címenként." },
  booking: { title: "Online időpontfoglalás", description: "A publikus foglalási API túlterhelésének és botforgalmának korlátozása." },
  api: { title: "Általános VIR API", description: "Nagy forgalmú belső API-védelem. A limit szándékosan magas, hogy NAT mögötti szalonokat se fogjon meg." },
};

const errorText = (error: any) => error?.response?.data?.error || error?.response?.data?.message || error?.message || "A művelet nem sikerült.";
const fmtDate = (value?: string | null) => value ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const minutes = (ms: number) => Math.max(1, Math.round(ms / 60_000));

export default function SecuritySettingsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [policies, setPolicies] = useState<Record<PolicyName, Policy> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/admin/security-settings");
      setData(response.data);
      setPolicies(response.data?.policies || null);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const cloudflareReady = Boolean(data?.cloudflare.api_token_configured && data?.cloudflare.zone_id_configured);
  const changed = useMemo(() => data && policies ? JSON.stringify(data.policies) !== JSON.stringify(policies) : false, [data, policies]);

  function setPolicy(name: PolicyName, patch: Partial<Policy>) {
    setPolicies(current => current ? { ...current, [name]: { ...current[name], ...patch } } : current);
  }

  async function save() {
    if (!policies) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.put("/admin/security-settings", { policies });
      setNotice("A biztonsági limitek mentve. Az új értékek azonnal érvényesek.");
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true); setError(""); setNotice("");
    try {
      await api.post("/admin/security-settings/reset");
      setNotice("Az alapértelmezett biztonsági limitek visszaállítva.");
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  return <main className="security-page">
    <header className="security-head">
      <div>
        <small>KLEOPÁTRA VIR · ADMIN · BIZTONSÁG</small>
        <h1><ShieldCheck /> Biztonsági beállítások</h1>
        <p>DDoS/proxy állapot, kliens-IP diagnosztika és az API, a belépés, valamint az online időpontfoglalás forgalomkorlátozása.</p>
      </div>
      <div className="security-actions">
        <button className="security-secondary" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "spin" : ""}/>Frissítés</button>
        <button className="security-secondary" onClick={() => void reset()} disabled={saving}><RotateCcw/>Alapértékek</button>
        <button className="security-primary" onClick={() => void save()} disabled={saving || !changed}><Save/>{saving ? "Mentés…" : "Mentés"}</button>
      </div>
    </header>

    {error && <div className="security-alert error"><AlertTriangle />{error}</div>}
    {notice && <div className="security-alert ok"><CheckCircle2 />{notice}</div>}

    {loading && !data ? <section className="security-card">Biztonsági állapot betöltése…</section> : <>
      <section className="security-grid">
        <article className="security-card">
          <div className="security-card-title"><Cloud/><div><h2>Cloudflare / DDoS</h2><p>A titkos API token soha nem kerül a böngészőbe.</p></div></div>
          <div className="security-status-row"><span>API token</span><b className={data?.cloudflare.api_token_configured ? "good" : "warn"}>{data?.cloudflare.api_token_configured ? "Beállítva" : "Nincs beállítva"}</b></div>
          <div className="security-status-row"><span>Zone ID</span><b className={data?.cloudflare.zone_id_configured ? "good" : "warn"}>{data?.cloudflare.zone_id_configured ? "Beállítva" : "Nincs beállítva"}</b></div>
          <div className="security-status-row"><span>Cloudflare fejléc ezen a kérésen</span><b className={data?.cloudflare.headers_detected ? "good" : "muted"}>{data?.cloudflare.headers_detected ? "Érzékelve" : "Nem érzékelve"}</b></div>
          <div className="security-status-row"><span>CF-Ray</span><code>{data?.cloudflare.cf_ray || "—"}</code></div>
          {!cloudflareReady && <p className="security-note"><AlertTriangle/>A Cloudflare hitelesítéshez Render környezeti változóként add meg a <code>CLOUDFLARE_API_TOKEN</code> és <code>CLOUDFLARE_ZONE_ID</code> értékeket. Ezeket nem tároljuk a frontendben.</p>}
        </article>

        <article className="security-card">
          <div className="security-card-title"><Wifi/><div><h2>Proxy és kliens-IP</h2><p>Diagnosztika a helyes rate-limit kulcshoz.</p></div></div>
          <div className="security-status-row"><span>Express trust proxy</span><b>{data?.proxy.express_trust_proxy_expected ?? 1}</b></div>
          <div className="security-status-row"><span>Alkalmazás által látott IP</span><code>{data?.proxy.request_ip || "—"}</code></div>
          <div className="security-status-row"><span>CF-Connecting-IP</span><code>{data?.proxy.cf_connecting_ip || "—"}</code></div>
          <div className="security-status-row"><span>X-Forwarded-For lánc</span><code>{data?.proxy.x_forwarded_for || "—"}</code></div>
          <div className="security-status-row"><span>Proxy hopok</span><b>{data?.proxy.forwarded_chain_length ?? 0}</b></div>
        </article>
      </section>

      <section className="security-card">
        <div className="security-card-title"><ShieldCheck/><div><h2>Rate limit szabályok</h2><p>A módosítás mentés után azonnal érvényes; az értékek PostgreSQL-ben megmaradnak deploy után is.</p></div></div>
        <div className="security-policy-grid">
          {policies && (Object.keys(labels) as PolicyName[]).map(name => {
            const policy = policies[name];
            return <article className="security-policy" key={name}>
              <div className="security-policy-head"><div><h3>{labels[name].title}</h3><p>{labels[name].description}</p></div><label className="security-switch"><input type="checkbox" checked={policy.enabled} onChange={e => setPolicy(name, { enabled: e.target.checked })}/><span>{policy.enabled ? "Aktív" : "Kikapcsolva"}</span></label></div>
              <label>Max. kérés / ablak<input type="number" min={1} max={100000} value={policy.max} onChange={e => setPolicy(name, { max: Number(e.target.value) || 1 })}/></label>
              <label>Időablak (perc)<input type="number" min={1} max={1440} value={minutes(policy.windowMs)} onChange={e => setPolicy(name, { windowMs: Math.max(1, Number(e.target.value) || 1) * 60_000 })}/></label>
              <small>Jelenleg: {policy.max.toLocaleString("hu-HU")} kérés / {minutes(policy.windowMs)} perc / IP</small>
            </article>;
          })}
        </div>
        {data?.persistence.warning && <p className="security-note"><AlertTriangle/>{data.persistence.warning}</p>}
        <div className="security-meta">Utolsó mentés: <b>{fmtDate(data?.persistence.updated_at)}</b>{data?.persistence.updated_by ? <> · módosította: <b>{data.persistence.updated_by}</b></> : null} · limiter store: <b>{data?.persistence.limiter_store || "—"}</b></div>
      </section>
    </>}
  </main>;
}
