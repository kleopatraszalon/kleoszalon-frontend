import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Image,
  Megaphone,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Settings2,
  Sparkles,
} from "lucide-react";
import api from "../api/api";
import "./SocialPublishingPage.css";

type Platform = "facebook" | "instagram" | "tiktok";
const PLATFORM_LABEL: Record<Platform, string> = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };
const PLATFORM_SHORT: Record<Platform, string> = { facebook: "f", instagram: "◎", tiktok: "♪" };
const statuses: Record<string, string> = {
  draft: "Piszkozat",
  scheduled: "Időzítve",
  processing: "Feldolgozás",
  submitted: "Beküldve",
  published: "Közzétéve",
  partial: "Részben sikeres",
  failed: "Hiba",
};
const initialPayloads: any = {
  facebook: { caption: "", cta_label: "Foglalok" },
  instagram: { caption: "" },
  tiktok: {
    title: "",
    caption: "",
    privacy_level: "SELF_ONLY",
    disable_comment: false,
    disable_duet: false,
    disable_stitch: false,
    brand_organic_toggle: true,
    consent_confirmed: false,
  },
};
const fresh = () => ({
  source_type: "manual",
  source_id: "",
  name: "",
  headline: "",
  description: "",
  image_url: "",
  video_url: "",
  link_url: "",
  scheduled_at: "",
  platforms: ["facebook", "instagram"] as Platform[],
  platform_payloads: JSON.parse(JSON.stringify(initialPayloads)),
});
function message(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || "A művelet sikertelen.";
}
function localDateTime(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function imageData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Csak képfájl tölthető fel."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("A kép legfeljebb 8 MB lehet."));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("A kép nem olvasható."));
    reader.readAsDataURL(file);
  });
}

export default function SocialPublishingPage() {
  const [data, setData] = useState<any>({ campaigns: [], sources: { jobs: [], daily_actions: [] }, accounts: {} });
  const [form, setForm] = useState<any>(fresh());
  const [editing, setEditing] = useState<any>(null);
  const [verification, setVerification] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setData((await api.get("/transactions/newsletters/social/overview")).data);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const privacyOptions = useMemo(() => {
    const fromVerification = verification?.tiktok?.account?.privacy_level_options;
    return Array.isArray(fromVerification) && fromVerification.length ? fromVerification : ["SELF_ONLY"];
  }, [verification]);

  async function generate(next = form) {
    setError("");
    try {
      const result = await api.post("/transactions/newsletters/social/generate-copy", next);
      const withCopy = { ...next, platform_payloads: result.data.platform_payloads };
      setForm(withCopy);
      return withCopy;
    } catch (e) {
      setError(message(e));
      return next;
    }
  }

  async function verifyAccounts() {
    setBusy(true);
    setError("");
    try {
      const result = (await api.post("/transactions/newsletters/social/accounts/verify")).data;
      setVerification(result.verification || {});
      setData((current: any) => ({ ...current, accounts: result.accounts, meta_graph_version: result.meta_graph_version }));
      setNotice("A social fiókok ellenőrzése befejeződött.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  async function applySource(type: string, id: string) {
    setEditing(null);
    let next: any = { ...fresh(), source_type: type, source_id: id };
    if (type === "daily_action") {
      const source = data.sources.daily_actions.find((item: any) => item.id === id);
      if (source) next = {
        ...next,
        name: source.name || source.headline,
        headline: source.headline || source.name,
        description: source.description_html || "",
        image_url: source.image_url || "",
        link_url: source.cta_url || "",
      };
    }
    if (type === "job") {
      const source = data.sources.jobs.find((item: any) => item.id === id);
      if (source) next = {
        ...next,
        name: `Álláshirdetés – ${source.position_name}`,
        headline: `${source.position_name} kollégát keresünk`,
        description: [source.description, source.requirements ? `Elvárások: ${source.requirements}` : ""].filter(Boolean).join("\n\n"),
        platforms: ["facebook", "instagram", "tiktok"],
      };
    }
    await generate(next);
  }

  function togglePlatform(platform: Platform) {
    const selected: Platform[] = form.platforms || [];
    setForm({ ...form, platforms: selected.includes(platform) ? selected.filter(item => item !== platform) : [...selected, platform] });
  }

  function payload(platform: Platform, key: string, value: any) {
    setForm({
      ...form,
      platform_payloads: {
        ...form.platform_payloads,
        [platform]: { ...(form.platform_payloads?.[platform] || {}), [key]: value },
      },
    });
  }

  async function persist() {
    const body = { ...form };
    const result = editing?.id
      ? await api.patch(`/transactions/newsletters/social/campaigns/${editing.id}`, body)
      : await api.post("/transactions/newsletters/social/campaigns", body);
    setEditing(result.data);
    return result.data;
  }

  async function save() {
    setBusy(true); setError(""); setNotice("");
    try {
      await persist();
      setNotice("A social kampány elmentve.");
      await load();
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }

  async function schedule() {
    if (!form.scheduled_at) return setError("Adja meg a publikálás időpontját.");
    setBusy(true); setError(""); setNotice("");
    try {
      const campaign = await persist();
      await api.post(`/transactions/newsletters/social/campaigns/${campaign.id}/schedule`, { scheduled_at: form.scheduled_at });
      setNotice(`A kampány időzítve: ${new Date(form.scheduled_at).toLocaleString("hu-HU")}.`);
      await load();
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }

  async function publishNow() {
    if (!window.confirm("Közzéteszi most a kiválasztott Facebook / Instagram / TikTok csatornákon?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const campaign = await persist();
      const result = (await api.post(`/transactions/newsletters/social/campaigns/${campaign.id}/publish`)).data;
      setEditing(result);
      setNotice("A publikálási folyamat lefutott. Az egyes csatornák státusza lent látható.");
      await load();
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }

  async function retry(publicationId: string) {
    setBusy(true); setError("");
    try {
      await api.post(`/transactions/newsletters/social/publications/${publicationId}/retry`);
      setNotice("Az újrapróbálás lefutott.");
      await load();
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }

  function openCampaign(campaign: any) {
    setEditing(campaign);
    setForm({
      ...campaign,
      source_id: campaign.source_id || "",
      scheduled_at: localDateTime(campaign.scheduled_at),
      platforms: (campaign.publications || []).map((item: any) => item.platform),
      platform_payloads: campaign.platform_payloads || initialPayloads,
    });
  }

  function newCampaign() {
    setEditing(null);
    setForm(fresh());
    setNotice("");
    setError("");
  }

  return (
    <main className="social-hub">
      <nav className="social-tabs">
        <a href="/marketing/newsletter">Hírlevelek</a>
        <a href="/marketing/daily-deals">Napi akciók</a>
        <a className="active" href="/marketing/newsletter?view=social">Social Hub</a>
      </nav>

      <header className="social-head">
        <div>
          <small>MARKETING & SOCIAL PUBLISHING HUB</small>
          <h1><Megaphone /> Facebook · Instagram · TikTok</h1>
          <p>Kampányok és álláshirdetések létrehozása, platformonkénti szövegezése, időzítése és publikálási naplója közvetlenül a VIR-ből.</p>
        </div>
        <div className="social-head-actions">
          <button className="ghost" onClick={() => void verifyAccounts()} disabled={busy}><Settings2 /> Fiókok ellenőrzése</button>
          <button onClick={newCampaign}><Megaphone /> Új kampány</button>
        </div>
      </header>

      {error && <div className="social-note error">{error}</div>}
      {notice && <div className="social-note ok">{notice}</div>}

      <section className="social-accounts">
        {(["facebook", "instagram", "tiktok"] as Platform[]).map(platform => {
          const account = data.accounts?.[platform] || {};
          const check = verification?.[platform];
          return <article key={platform} className={account.configured ? "configured" : "missing"}>
            <span className={`social-brand ${platform}`}>{PLATFORM_SHORT[platform]}</span>
            <div><b>{PLATFORM_LABEL[platform]}</b><small>{check?.ok ? (check.account?.name || check.account?.creator_nickname || check.account?.username || "Kapcsolat rendben") : account.configured ? "Konfigurálva · ellenőrzésre kész" : "Beállítás szükséges"}</small></div>
            {check?.ok ? <CheckCircle2 /> : <span className="status-dot" />}
          </article>;
        })}
      </section>

      <div className="social-layout">
        <aside className="social-history">
          <div className="history-title"><b>Publikálási előzmények</b><button onClick={() => void load()}><RefreshCw className={busy ? "spin" : ""} /></button></div>
          {data.campaigns.map((campaign: any) => <button key={campaign.id} className={`history-card ${editing?.id === campaign.id ? "active" : ""}`} onClick={() => openCampaign(campaign)}>
            <span><b>{campaign.name}</b><small>{campaign.headline}</small></span>
            <em className={`state ${campaign.status}`}>{statuses[campaign.status] || campaign.status}</em>
            <div>{(campaign.publications || []).map((publication: any) => <i key={publication.id} title={publication.error || publication.status} className={`${publication.platform} ${publication.status}`}>{PLATFORM_SHORT[publication.platform as Platform]}</i>)}</div>
          </button>)}
          {!data.campaigns.length && <p className="social-empty">Még nincs social kampány.</p>}
        </aside>

        <section className="social-workspace">
          <div className="source-panel">
            <div><Sparkles /><span><b>Forrás a VIR-ből</b><small>Új kampány, napi akció vagy HR álláshirdetés</small></span></div>
            <select value={form.source_type} onChange={e => void applySource(e.target.value, "")}>
              <option value="manual">Önálló marketing kampány</option>
              <option value="daily_action">Napi akció átvétele</option>
              <option value="job">Álláshirdetés / munkatárs keresése</option>
            </select>
            {form.source_type === "daily_action" && <select value={form.source_id || ""} onChange={e => void applySource("daily_action", e.target.value)}><option value="">Válasszon napi akciót…</option>{data.sources.daily_actions.map((item: any) => <option key={item.id} value={item.id}>{item.name} — {item.headline}</option>)}</select>}
            {form.source_type === "job" && <select value={form.source_id || ""} onChange={e => void applySource("job", e.target.value)}><option value="">Válasszon nyitott pozíciót…</option>{data.sources.jobs.map((item: any) => <option key={item.id} value={item.id}>{item.position_name} · {item.status}</option>)}</select>}
          </div>

          <div className="social-fields">
            <label>Kampánynév<input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label>Főcím<input value={form.headline || ""} onChange={e => setForm({ ...form, headline: e.target.value })} /></label>
            <label className="wide">Alapszöveg<textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
            <label>Foglalási / jelentkezési link<input placeholder="https://..." value={form.link_url || ""} onChange={e => setForm({ ...form, link_url: e.target.value })} /></label>
            <label>Videó URL (Reels / TikTok)<input placeholder="https://...mp4" value={form.video_url || ""} onChange={e => setForm({ ...form, video_url: e.target.value })} /></label>
            <label className="wide media-field">Kampánykép<input placeholder="Nyilvános URL vagy kép feltöltése" value={(form.image_url || "").startsWith("data:") ? "Feltöltött kép" : form.image_url || ""} onChange={e => setForm({ ...form, image_url: e.target.value })} /><span><Image /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { setForm({ ...form, image_url: await imageData(file) }); } catch (err) { setError(message(err)); } }} /></span></label>
          </div>

          {(form.image_url || form.video_url) && <div className="social-media-preview">{form.image_url && <img src={form.image_url} alt="Kampány előnézet" />}{form.video_url && <div><ExternalLink /> Videó: {form.video_url}</div>}</div>}

          <div className="channel-picker">
            <div><b>Csatornák</b><button onClick={() => void generate()}><Sparkles /> Platformszövegek újragenerálása</button></div>
            <div>{(["facebook", "instagram", "tiktok"] as Platform[]).map(platform => <button key={platform} className={(form.platforms || []).includes(platform) ? `on ${platform}` : platform} onClick={() => togglePlatform(platform)}><span className={`social-brand ${platform}`}>{PLATFORM_SHORT[platform]}</span>{PLATFORM_LABEL[platform]}</button>)}</div>
          </div>

          <div className="platform-editors">
            {(form.platforms || []).includes("facebook") && <article><h3><span className="social-brand facebook">f</span>Facebook</h3><textarea value={form.platform_payloads?.facebook?.caption || ""} onChange={e => payload("facebook", "caption", e.target.value)} /><small>A VIR UTM-forrásjelölést tesz a foglalási vagy jelentkezési linkre.</small></article>}
            {(form.platforms || []).includes("instagram") && <article><h3><span className="social-brand instagram">◎</span>Instagram</h3><textarea value={form.platform_payloads?.instagram?.caption || ""} onChange={e => payload("instagram", "caption", e.target.value)} /><small>Kép vagy videó szükséges. Videó esetén Reels publikálás történik.</small></article>}
            {(form.platforms || []).includes("tiktok") && <article className="tiktok-editor"><h3><span className="social-brand tiktok">♪</span>TikTok</h3><label>Cím<input value={form.platform_payloads?.tiktok?.title || ""} onChange={e => payload("tiktok", "title", e.target.value)} /></label><textarea value={form.platform_payloads?.tiktok?.caption || ""} onChange={e => payload("tiktok", "caption", e.target.value)} /><div className="tiktok-options"><label>Láthatóság<select value={form.platform_payloads?.tiktok?.privacy_level || "SELF_ONLY"} onChange={e => payload("tiktok", "privacy_level", e.target.value)}>{privacyOptions.map((value: string) => <option key={value} value={value}>{value}</option>)}</select></label><label className="consent"><input type="checkbox" checked={Boolean(form.platform_payloads?.tiktok?.consent_confirmed)} onChange={e => payload("tiktok", "consent_confirmed", e.target.checked)} /> Jóváhagyom, hogy a VIR ezt a tartalmat a fenti TikTok-fiókba küldje.</label></div><small>A TikTok publikálás előtt a VIR lekéri a creator_info adatokat és csak a fiók által engedett láthatóságot használja.</small></article>}
          </div>

          <div className="publish-bar">
            <label><CalendarClock /> Publikálás időpontja<input type="datetime-local" value={form.scheduled_at || ""} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></label>
            <div><button className="ghost" onClick={save} disabled={busy}><Save /> Mentés</button><button className="schedule" onClick={schedule} disabled={busy}><CalendarClock /> Időzítés</button><button className="publish" onClick={publishNow} disabled={busy}><Send /> Közzététel most</button></div>
          </div>

          {editing?.publications?.length > 0 && <section className="publication-log"><h2>Publikálási napló</h2>{editing.publications.map((publication: any) => <article key={publication.id}><span className={`social-brand ${publication.platform}`}>{PLATFORM_SHORT[publication.platform as Platform]}</span><div><b>{PLATFORM_LABEL[publication.platform as Platform]}</b><small>{statuses[publication.status] || publication.status}{publication.external_id ? ` · ID: ${publication.external_id}` : ""}</small>{publication.error && <p>{publication.error}</p>}</div>{publication.status === "failed" && <button onClick={() => void retry(publication.id)}><RotateCcw /> Újrapróbálás</button>}</article>)}</section>}

          {form.source_type === "job" && <div className="job-attribution"><BriefcaseBusiness /><div><b>Toborzási forrásmérés bekapcsolva</b><span>A publikált linkek Facebook / Instagram / TikTok UTM-forrást kapnak, így a jelentkezések forrása a HR-folyamathoz kapcsolható.</span></div></div>}
        </section>
      </div>
    </main>
  );
}
