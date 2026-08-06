import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Edit3, Plus, Search, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import withBase from "../utils/apiBase";
import "./KnowledgeBasePage.css";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  category: string;
  tags: string[];
  status: string;
  visibility: string;
  version: number;
  updated_at: string;
};

const authHeaders = () => {
  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token");
  return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(withBase(path), {
    ...init,
    credentials: "include",
    headers: { ...authHeaders(), ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `HTTP ${response.status}`);
  return body as T;
}

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Article | null>(null);
  const [editor, setEditor] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const rows = await request<Article[]>(`vir-modules/knowledge/articles?search=${encodeURIComponent(query.trim())}`);
      const list = Array.isArray(rows) ? rows : [];
      setArticles(list);
      setSelected((current) => current && list.some((row) => row.id === current.id) ? list.find((row) => row.id === current.id) || null : list[0] || null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "A tudásbázis nem tölthető be."); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => Array.from(new Set(articles.map((article) => article.category))).sort(), [articles]);

  const openEditor = (article?: Article) => {
    setForm(article ? { ...article, tags: article.tags.join(", ") } : { status: "draft", visibility: "internal", category: "Általános", tags: "" });
    setEditor(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, tags: String(form.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean) };
      if (form.id) await request(`vir-modules/knowledge/articles/${form.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await request("vir-modules/knowledge/articles", { method: "POST", body: JSON.stringify(payload) });
      setEditor(false); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "A cikk mentése nem sikerült."); }
    finally { setSaving(false); }
  };

  return (
    <main className="knowledge-page">
      <header className="knowledge-page__header">
        <div><p>Tudásbázis és AI</p><h1>Belső tudás, egy helyen</h1><span>Eljárásrendek, oktatási anyagok és napi működési útmutatók kereshető gyűjteménye.</span></div>
        <div><button type="button" onClick={() => navigate("/knowledge/assistant")}><Sparkles size={17}/> Kérdezze a Kleo AI-t</button><button className="is-primary" type="button" onClick={() => openEditor()}><Plus size={17}/> Új cikk</button></div>
      </header>
      {error && <div className="knowledge-page__alert">{error}<button onClick={() => setError("")}><X size={15}/></button></div>}
      <section className="knowledge-page__stats"><article><BookOpen/><div><strong>{articles.length}</strong><span>aktív tudásbáziscikk</span></div></article><article><Sparkles/><div><strong>{categories.length}</strong><span>szakmai kategória</span></div></article><article><span className="knowledge-page__brand-dot"/><div><strong>{articles.filter((a) => a.status === "published").length}</strong><span>publikált útmutató</span></div></article></section>
      <section className="knowledge-page__workspace">
        <aside>
          <form onSubmit={(event) => { event.preventDefault(); void load(); }}><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keresés címben és tartalomban…"/><button>Keresés</button></form>
          <div className="knowledge-page__list">
            {articles.map((article) => <button key={article.id} className={selected?.id === article.id ? "is-active" : ""} type="button" onClick={() => setSelected(article)}><span>{article.category}</span><strong>{article.title}</strong><small>{article.summary || article.content.slice(0, 90)}</small></button>)}
            {!loading && !articles.length && <div className="knowledge-page__empty">Nincs találat.</div>}
            {loading && <div className="knowledge-page__empty">Betöltés…</div>}
          </div>
        </aside>
        <article className="knowledge-article">
          {selected ? <><header><div><p>{selected.category} · v{selected.version}</p><h2>{selected.title}</h2><div>{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><button type="button" onClick={() => openEditor(selected)}><Edit3 size={16}/> Szerkesztés</button></header>{selected.summary && <blockquote>{selected.summary}</blockquote>}<div className="knowledge-article__content">{selected.content.split("\n").map((line, index) => <p key={index}>{line}</p>)}</div><footer>Utolsó módosítás: {new Date(selected.updated_at).toLocaleString("hu-HU")}</footer></> : <div className="knowledge-article__welcome"><BookOpen size={34}/><h2>Válasszon egy tudásbáziscikket</h2><p>A tartalom itt olvasható, szerkeszthető, és az AI asszisztens is ezekből az elfogadott belső forrásokból dolgozik.</p></div>}
        </article>
      </section>
      {editor && <div className="knowledge-editor"><button className="knowledge-editor__backdrop" type="button" onClick={() => setEditor(false)}/><form onSubmit={save}><header><div><p>Tudásbázis</p><h2>{form.id ? "Cikk szerkesztése" : "Új cikk"}</h2></div><button type="button" onClick={() => setEditor(false)}><X/></button></header><div className="knowledge-editor__body"><label><span>Cím *</span><input required value={form.title || ""} onChange={(e) => setForm((old) => ({ ...old, title: e.target.value }))}/></label><label><span>Kategória</span><input value={form.category || ""} onChange={(e) => setForm((old) => ({ ...old, category: e.target.value }))}/></label><label className="is-wide"><span>Rövid összefoglaló</span><textarea value={form.summary || ""} onChange={(e) => setForm((old) => ({ ...old, summary: e.target.value }))}/></label><label className="is-wide"><span>Tartalom *</span><textarea className="is-content" required value={form.content || ""} onChange={(e) => setForm((old) => ({ ...old, content: e.target.value }))}/></label><label><span>Címkék, vesszővel</span><input value={form.tags || ""} onChange={(e) => setForm((old) => ({ ...old, tags: e.target.value }))}/></label><label><span>Állapot</span><select value={form.status || "draft"} onChange={(e) => setForm((old) => ({ ...old, status: e.target.value }))}><option value="draft">Piszkozat</option><option value="published">Publikált</option><option value="archived">Archivált</option></select></label></div><footer><button type="button" onClick={() => setEditor(false)}>Mégse</button><button className="is-primary" disabled={saving}>{saving ? "Mentés…" : "Mentés"}</button></footer></form></div>}
    </main>
  );
}
