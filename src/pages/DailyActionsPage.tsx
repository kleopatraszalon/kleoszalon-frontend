import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Image,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Send,
  Smartphone,
  Users,
} from "lucide-react";
import api from "../api/api";
import "./DailyActionsPage.css";
const KLEOPATRA_LOGO = "/kleopatra-logo.png";
const localDateTime = (value: unknown) => {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const normalizedChannels = (value: unknown) => {
  const values = Array.isArray(value) ? value : [];
  const result = Array.from(new Set(values.map(String).map(x => x === "push" ? "app" : x)
    .filter(x => ["email", "sms", "app"].includes(x))));
  return result.length ? result : ["app"];
};
const empty: any = {
  name: "",
  headline: "",
  description_html:
    "<p>Kedves {{nev}}!</p><p>Írja ide a napi akció részleteit.</p>",
  image_url: "",
  discount_text: "",
  cta_label: "Foglalok",
  cta_url: "/foglalas",
  valid_from: "",
  valid_until: "",
  audience: { type: "all", days: 30, tiers: ["bronze", "silver", "gold"] },
  channels: ["app"],
};
function m(e: any) {
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || "A művelet sikertelen.";
}
function optimizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Csak képfájl tölthető fel."));
    const url = URL.createObjectURL(file), img = document.createElement("img");
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1600, scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("A kép nem dolgozható fel."));
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", .82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("A kép nem olvasható.")); };
    img.src = url;
  });
}
export default function DailyActionsPage() {
  const [data, setData] = useState<any>({ campaigns: [] }),
    [form, setForm] = useState<any>(empty),
    [selected, setSelected] = useState<any>(null),
    [stats, setStats] = useState<any>({ count: 0, email: 0, sms: 0 }),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    editor = useRef<HTMLDivElement>(null),
    file = useRef<HTMLInputElement>(null);
  async function load() {
    setBusy(true);
    try {
      setData((await api.get("/transactions/daily-actions")).data);
    } catch (e) {
      setError(m(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function open(x: any) {
    setSelected(x);
    setForm({
      ...x,
      valid_from: localDateTime(x.valid_from),
      valid_until: localDateTime(x.valid_until),
      audience: x.audience || { type: "all" },
      channels: normalizedChannels(x.channels),
    });
  }
  function channel(v: string) {
    const a = form.channels || [];
    setForm({
      ...form,
      channels: a.includes(v) ? a.filter((x: string) => x !== v) : [...a, v],
    });
  }
  async function image(e: any) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    try {
      const image_url = await optimizeImage(f);
      setForm((current: any) => ({ ...current, image_url }));
      setNotice("A kép optimalizálva és beszúrva.");
    } catch (err) {
      setError(m(err));
    } finally {
      e.target.value = "";
    }
  }
  async function count() {
    try {
      setStats(
        (
          await api.post(
            "/transactions/daily-actions/audience-preview",
            form.audience,
          )
        ).data,
      );
    } catch (e) {
      setError(m(e));
    }
  }
  async function persist() {
    const p = {...form,description_html:editor.current?.innerHTML||form.description_html};
    const r = selected?await api.patch(`/transactions/daily-actions/${selected.id}`,p):await api.post("/transactions/daily-actions",p);
    setSelected(r.data);
    return r.data;
  }
  async function save() {
    setBusy(true);setError("");setNotice("");
    try {
      await persist();
      setNotice("Az akció elmentve.");
      await load();
    } catch (e) {
      setError(m(e));
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (
      !window.confirm(
        `Közzéteszi és kiküldi ${stats.count || selected?.recipient_count || 0} vendégnek?`,
      )
    )
      return;
    setBusy(true);setError("");setNotice("");
    try {
      const campaign=await persist();
      const r = await api.post(
        `/transactions/daily-actions/${campaign.id}/publish`,
      );
      const pushState=!r.data.push_configured?" A telefonos push nincs konfigurálva a szerveren.":r.data.active_devices===0?" Nincs még értesítésre feliratkozott telefon.":r.data.push_failures?` ${r.data.push_failures} készüléknél átmeneti küldési hiba történt.`:"";
      setNotice(
        `Közzétéve: ${r.data.email} e-mail, ${r.data.sms} SMS, ${r.data.push}/${r.data.active_devices||0} telefonos értesítés.${pushState}`,
      );
      await load();
    } catch (e) {
      setError(m(e));
    } finally {
      setBusy(false);
    }
  }
  const a = form.audience || {};
  return (
    <main className="da">
      <header>
        <div>
          <small>NAPI AKCIÓK</small>
          <h1>
            <Bell />
            Kampány- és appértesítés stúdió
          </h1>
          <p>Egy akció, három csatorna: e-mail, SMS és Kleopátra App.</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setForm({ ...empty });
          }}
        >
          <Plus />
          Új akció
        </button>
      </header>
      {error && <div className="da-note error">{error}</div>}
      {notice && <div className="da-note ok">{notice}</div>}
      <div className="da-layout">
        <aside>
          <b>Korábbi akciók</b>
          <button className="refresh" onClick={() => void load()}>
            <RefreshCw />
          </button>
          {data.campaigns.map((x: any) => (
            <button
              key={x.id}
              className={`da-old ${selected?.id === x.id ? "active" : ""}`}
              onClick={() => open(x)}
            >
              <span>
                <b>{x.name}</b>
                <small>{x.headline}</small>
              </span>
              <em>{x.status}</em>
              <small>
                {x.sent_email || 0} e-mail · {x.sent_sms || 0} SMS ·{" "}
                {x.sent_push || 0} push
              </small>
            </button>
          ))}
        </aside>
        <section className="da-editor">
          <div className="da-fields">
            <label>
              Kampánynév
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Főcím
              <input
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
              />
            </label>
            <label>
              Kedvezmény / kiemelés
              <input
                value={form.discount_text}
                onChange={(e) =>
                  setForm({ ...form, discount_text: e.target.value })
                }
              />
            </label>
            <label>
              Érvényesség kezdete
              <input
                type="datetime-local"
                value={form.valid_from?.slice?.(0, 16) || form.valid_from}
                onChange={(e) =>
                  setForm({ ...form, valid_from: e.target.value })
                }
              />
            </label>
            <label>
              Érvényesség vége
              <input
                type="datetime-local"
                value={form.valid_until?.slice?.(0, 16) || form.valid_until}
                onChange={(e) =>
                  setForm({ ...form, valid_until: e.target.value })
                }
              />
            </label>
          </div>
          <div className="da-compose">
            <div className="da-card-preview">
              {form.image_url ? (
                <img src={form.image_url} alt="Akció" />
              ) : (
                <button onClick={() => file.current?.click()}>
                  <Image />
                  Kép beszúrása
                </button>
              )}
              <input
                ref={file}
                hidden
                type="file"
                accept="image/*"
                onChange={image}
              />
              <div>
                <img
                  className="da-brand-logo"
                  src={KLEOPATRA_LOGO}
                  alt="Kleopátra Szépségszalonok"
                />
                <span>NAPI AJÁNLAT</span>
                <h2>{form.headline || "Az akció főcíme"}</h2>
                <strong>{form.discount_text}</strong>
                <div
                  ref={editor}
                  className="da-rich"
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: form.description_html }}
                />
                <button className="cta">{form.cta_label}</button>
              </div>
            </div>
            <div className="da-mobile">
              <span></span>
              <div>
                {form.image_url && <img src={form.image_url} alt="" />}
                <small>MAI AJÁNLAT</small>
                <h3>{form.headline || "Kleopátra napi akció"}</h3>
                <b>{form.discount_text}</b>
                <p>Érintsd meg az értesítést és foglalj néhány lépésben.</p>
              </div>
            </div>
          </div>
          <div className="da-target">
            <h2>
              <Users />
              Célcsoport és csatornák
            </h2>
            <div>
              <label>
                Célcsoport
                <select
                  value={a.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      audience: { ...a, type: e.target.value },
                    })
                  }
                >
                  <option value="all">Minden hozzájárult vendég</option>
                  <option value="new">Új vendégek</option>
                  <option value="inactive">Inaktív vendégek</option>
                  <option value="loyalty">Törzsvendég-fokozatok</option>
                  <option value="pass_holders">Aktív bérletesek</option>
                </select>
              </label>
              {["new", "inactive"].includes(a.type) && (
                <label>
                  Nap
                  <input
                    type="number"
                    value={a.days || 30}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        audience: { ...a, days: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              )}
              <div className="da-channels">
                <button
                  className={
                    (form.channels || []).includes("email") ? "on" : ""
                  }
                  onClick={() => channel("email")}
                >
                  <Mail />
                  E-mail
                </button>
                <button
                  className={(form.channels || []).includes("sms") ? "on" : ""}
                  onClick={() => channel("sms")}
                >
                  <MessageSquare />
                  SMS
                </button>
                <button
                  className={(form.channels || []).includes("app") ? "on" : ""}
                  onClick={() => channel("app")}
                >
                  <Smartphone />
                  App push
                </button>
              </div>
              <button onClick={() => void count()}>
                <Users />
                Címzettek számolása
              </button>
            </div>
            <p>
              <b>{stats.count}</b> vendég · {stats.email} e-mail · {stats.sms}{" "}
              SMS · az app push az aktív készülékekre megy
            </p>
          </div>
          <footer>
            <button onClick={save}>
              <Save />
              Mentés
            </button>
            <button
              className="publish"
              onClick={publish}
              disabled={busy || !selected}
            >
              <Send />
              Közzététel és küldés
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
