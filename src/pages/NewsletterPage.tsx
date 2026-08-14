import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Image,
  Italic,
  Mail,
  Megaphone,
  Plus,
  RefreshCw,
  Send,
  TestTube2,
  Users,
} from "lucide-react";
import api from "../api/api";
import SocialPublishingPage from "./SocialPublishingPage";
import "./NewsletterPage.css";
const shell = (
  title = "Kleopátra hírlevél",
  body = "<p>Kedves {{nev}}!</p><p>Írja ide az ajánlat részleteit.</p>",
) =>
  `<div style="margin:0;background:#f5f0eb;padding:28px;font-family:Arial,sans-serif;color:#251a1f"><div style="max-width:680px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e9ddd3"><div style="background:#fff;padding:22px;text-align:center;border-bottom:1px solid #eadfce"><img src="${window.location.origin}/kleopatra-logo.png" alt="Kleopátra Szépségszalonok" style="display:block;width:100%;max-width:420px;height:auto;margin:0 auto"/></div><div style="padding:34px"><h1 style="font-family:Georgia,serif;font-size:30px;color:#39251f">${title}</h1>${body}</div><div style="background:#f4ebe3;padding:18px 34px;font-size:11px;color:#76665d">Kleopátra Szépségszalonok · Marketing hozzájárulás alapján küldött üzenet.</div></div></div>`;
const fresh: any = {
  name: "",
  subject: "",
  preheader: "",
  html_content: shell(),
  audience: { type: "all", days: 30, tiers: ["bronze", "silver", "gold"] },
};
const hu: any = {
  draft: "Piszkozat",
  sent: "Elküldve",
  partial: "Részben elküldve",
  sending: "Küldés alatt",
};
function msg(e: any) {
  return e?.response?.data?.message || e?.message || "A művelet sikertelen.";
}
function NewsletterStudio() {
  const [data, setData] = useState<any>({ campaigns: [], tags: [] }),
    [form, setForm] = useState<any>(fresh),
    [editing, setEditing] = useState<any>(null),
    [preview, setPreview] = useState<any>({ count: 0, sample: [] }),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    editor = useRef<HTMLDivElement>(null),
    file = useRef<HTMLInputElement>(null);
  async function load() {
    setBusy(true);
    try {
      setData((await api.get("/transactions/newsletters")).data);
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function count(a = form.audience) {
    try {
      setPreview(
        (await api.post("/transactions/newsletters/audience-preview", a)).data,
      );
    } catch (e) {
      setError(msg(e));
    }
  }
  function sync() {
    setForm((x: any) => ({
      ...x,
      html_content: editor.current?.innerHTML || x.html_content,
    }));
  }
  function command(c: string, v?: string) {
    document.execCommand(c, false, v);
    sync();
  }
  function insertImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      command("insertImage", String(r.result));
      setTimeout(
        () =>
          editor.current?.querySelectorAll("img").forEach((i) => {
            i.style.maxWidth = "100%";
            i.style.height = "auto";
          }),
        0,
      );
    };
    r.readAsDataURL(f);
  }
  async function save() {
    sync();
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        html_content: editor.current?.innerHTML || form.html_content,
      };
      const r = editing
        ? await api.patch(`/transactions/newsletters/${editing.id}`, payload)
        : await api.post("/transactions/newsletters", payload);
      setEditing(r.data);
      setNotice("A hírlevél elmentve.");
      await load();
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  }
  async function test() {
    const email = window.prompt("Tesztküldés e-mail címe:");
    if (!email) return;
    sync();
    try {
      await api.post("/transactions/newsletters/test-send", {
        email,
        subject: form.subject,
        preheader: form.preheader,
        html_content: editor.current?.innerHTML,
      });
      setNotice("A tesztküldés elindult.");
    } catch (e) {
      setError(msg(e));
    }
  }
  async function send() {
    if (!editing) return setError("Küldés előtt mentse a kampányt.");
    if (
      !window.confirm(
        `Biztosan elküldi a hírlevelet ${preview.count || editing.recipient_count || 0} címzettnek?`,
      )
    )
      return;
    setBusy(true);
    try {
      const r = await api.post(`/transactions/newsletters/${editing.id}/send`);
      setNotice(
        `Küldés kész: ${r.data.sent} sikeres, ${r.data.failed} sikertelen.`,
      );
      await load();
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  }
  function open(c: any) {
    setEditing(c);
    setForm({ ...c, audience: c.audience || { type: "all" } });
    setPreview({ count: c.recipient_count || 0, sample: [] });
  }
  function create() {
    setEditing(null);
    setForm({ ...fresh, html_content: shell() });
    setPreview({ count: 0, sample: [] });
  }
  const audience = form.audience || {};
  return (
    <main className="nl">
      <header>
        <div>
          <small>HÍRLEVELEK ÉS KAMPÁNYOK</small>
          <h1>
            <Mail />
            Hírlevélstúdió
          </h1>
          <p>
            Kleopátra-sablon, vizuális szerkesztés és pontos vendégcélzás egy
            helyen.
          </p>
        </div>
        <div className="nl-header-actions">
          <button className="nl-social" onClick={() => window.location.assign("/marketing/newsletter?view=social")}>
            <Megaphone />
            Social Hub
          </button>
          <button onClick={create}>
            <Plus />
            Új hírlevél
          </button>
        </div>
      </header>
      {error && <div className="nl-note error">{error}</div>}
      {notice && <div className="nl-note ok">{notice}</div>}
      <div className="nl-layout">
        <aside>
          <div className="nl-aside-head">
            <b>Korábbi kampányok</b>
            <button onClick={() => void load()}>
              <RefreshCw className={busy ? "spin" : ""} />
            </button>
          </div>
          {data.campaigns.map((c: any) => (
            <button
              className={`nl-campaign ${editing?.id === c.id ? "active" : ""}`}
              key={c.id}
              onClick={() => open(c)}
            >
              <span>
                <b>{c.name}</b>
                <small>{c.subject}</small>
              </span>
              <em>{hu[c.status] || c.status}</em>
              <small>
                {c.sent_count || 0}/{c.recipient_count || 0} kézbesítés
              </small>
            </button>
          ))}
        </aside>
        <section className="nl-work">
          <div className="nl-fields">
            <label>
              Kampánynév
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              E-mail tárgya
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </label>
            <label className="wide">
              Előnézeti szöveg
              <input
                value={form.preheader}
                onChange={(e) =>
                  setForm({ ...form, preheader: e.target.value })
                }
              />
            </label>
          </div>
          <div className="nl-toolbar">
            <button onClick={() => command("bold")} title="Félkövér">
              <Bold />
            </button>
            <button onClick={() => command("italic")} title="Dőlt">
              <Italic />
            </button>
            <button onClick={() => command("formatBlock", "h2")}>Címsor</button>
            <button
              onClick={() =>
                command("createLink", window.prompt("Hivatkozás URL:") || "")
              }
            >
              Link
            </button>
            <button onClick={() => file.current?.click()}>
              <Image />
              Kép beszúrása
            </button>
            <input
              ref={file}
              type="file"
              accept="image/*"
              hidden
              onChange={insertImage}
            />
            <span>
              Tipp: személyes megszólítás: <code>{"{{nev}}"}</code>
            </span>
          </div>
          <div
            className="nl-editor"
            ref={editor}
            contentEditable
            suppressContentEditableWarning
            onInput={sync}
            dangerouslySetInnerHTML={{ __html: form.html_content }}
          />
          <div className="nl-audience">
            <h2>
              <Users />
              Címzettek kiválasztása
            </h2>
            <div className="nl-audience-grid">
              <label>
                Célcsoport
                <select
                  value={audience.type || "all"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      audience: { ...audience, type: e.target.value },
                    })
                  }
                >
                  <option value="all">Minden hozzájárult vendég</option>
                  <option value="new">Új vendégek</option>
                  <option value="inactive">Régen járt vendégek</option>
                  <option value="loyalty">Törzsvendég-fokozatok</option>
                  <option value="pass_holders">Aktív bérletesek</option>
                  <option value="tag">CRM-címke / csoport</option>
                </select>
              </label>
              {["new", "inactive"].includes(audience.type) && (
                <label>
                  Napok száma
                  <input
                    type="number"
                    value={audience.days || 30}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        audience: { ...audience, days: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              )}
              {audience.type === "tag" && (
                <label>
                  Csoport
                  <select
                    value={audience.tag_id || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        audience: { ...audience, tag_id: e.target.value },
                      })
                    }
                  >
                    <option value="">Válasszon…</option>
                    {data.tags.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {audience.type === "loyalty" && (
                <div className="nl-tiers">
                  {[
                    ["bronze", "Bronz"],
                    ["silver", "Ezüst"],
                    ["gold", "Arany"],
                  ].map(([v, l]) => (
                    <label key={v}>
                      <input
                        type="checkbox"
                        checked={(audience.tiers || []).includes(v)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            audience: {
                              ...audience,
                              tiers: e.target.checked
                                ? [...(audience.tiers || []), v]
                                : (audience.tiers || []).filter(
                                    (x: string) => x !== v,
                                  ),
                            },
                          })
                        }
                      />
                      {l}
                    </label>
                  ))}
                </div>
              )}
              <button onClick={() => void count()}>
                <Users />
                Címzettek számolása
              </button>
            </div>
            <div className="nl-count">
              <b>{preview.count || 0}</b>
              <span>
                küldhető címzett, kizárólag érvényes e-mailes
                marketing-hozzájárulással
              </span>
            </div>
          </div>
          <footer>
            <button onClick={test}>
              <TestTube2 />
              Tesztküldés
            </button>
            <button onClick={save} disabled={busy}>
              Mentés
            </button>
            <button className="send" onClick={send} disabled={busy || !editing}>
              <Send />
              Küldés a célcsoportnak
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

export default function NewsletterPage() {
  const view = new URLSearchParams(window.location.search).get("view");
  return view === "social" ? <SocialPublishingPage /> : <NewsletterStudio />;
}
