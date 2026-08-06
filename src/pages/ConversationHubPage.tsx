import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, MessageCircle, Plus, Send, Sparkles, Users } from "lucide-react";
import { useLocation } from "react-router-dom";
import withBase from "../utils/apiBase";
import "./ConversationHubPage.css";

type Conversation = { id: string; title: string; conversation_type: "internal" | "ai"; last_message?: string; message_count?: number; updated_at: string };
type Message = { id: string; sender_type: string; sender_user_id?: string; content: string; metadata?: { sources?: Array<{ title: string; slug: string }>; ai_configured?: boolean; model?: string }; created_at: string };

const authHeaders = () => { const token = localStorage.getItem("kleo_token") || localStorage.getItem("token"); return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }; };
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { const response = await fetch(withBase(path), { ...init, credentials: "include", headers: { ...authHeaders(), ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) } }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body?.error || body?.detail || `HTTP ${response.status}`); return body as T; }

export default function ConversationHubPage() {
  const location = useLocation();
  const mode: "ai" | "internal" = location.pathname.includes("assistant") ? "ai" : "internal";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    try { const rows = await request<Conversation[]>(`vir-modules/conversations?type=${mode}`); const filtered = rows.filter((row) => row.conversation_type === mode); setConversations(filtered); setSelectedId((id) => id && filtered.some((row) => row.id === id) ? id : filtered[0]?.id || ""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "A beszélgetések nem tölthetők be."); }
  }, [mode]);

  const loadMessages = useCallback(async (id: string) => {
    if (!id) { setMessages([]); return; }
    try { setMessages(await request<Message[]>(`vir-modules/conversations/${id}/messages`)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Az üzenetek nem tölthetők be."); }
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => { void loadMessages(selectedId); }, [selectedId, loadMessages]);

  const selected = useMemo(() => conversations.find((row) => row.id === selectedId), [conversations, selectedId]);

  const newConversation = async () => {
    const title = window.prompt(mode === "ai" ? "Mi legyen az AI-beszélgetés címe?" : "Mi legyen a beszélgetés címe?");
    if (!title?.trim()) return;
    try { const created = await request<Conversation>("vir-modules/conversations", { method: "POST", body: JSON.stringify({ title: title.trim(), conversation_type: mode }) }); await loadConversations(); setSelectedId(created.id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "A beszélgetés nem hozható létre."); }
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault(); const content = input.trim(); if (!content || sending) return;
    setSending(true); setError(""); setInput("");
    try {
      if (mode === "ai") {
        const answer = await request<{ conversation_id: string }>("vir-modules/assistant", { method: "POST", body: JSON.stringify({ conversation_id: selectedId || undefined, message: content }) });
        if (!selectedId) setSelectedId(answer.conversation_id);
        await loadConversations(); await loadMessages(answer.conversation_id);
      } else {
        let id = selectedId;
        if (!id) { const created = await request<Conversation>("vir-modules/conversations", { method: "POST", body: JSON.stringify({ title: content.slice(0, 60), conversation_type: "internal" }) }); id = created.id; setSelectedId(id); }
        await request(`vir-modules/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ content }) });
        await loadConversations(); await loadMessages(id);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Az üzenet küldése nem sikerült."); setInput(content); }
    finally { setSending(false); }
  };

  return <main className={`conversation-page conversation-page--${mode}`}>
    <header><div><p>{mode === "ai" ? "Tudásbázis és AI" : "Működés és együttműködés"}</p><h1>{mode === "ai" ? "Kleo AI asszisztens" : "Belső chat"}</h1><span>{mode === "ai" ? "A jóváhagyott belső tudásbázisra támaszkodó, forrásjelölt segítség." : "Telephelyi, részleg- és csapatszintű belső egyeztetés."}</span></div><button type="button" onClick={() => void newConversation()}><Plus size={17}/> Új beszélgetés</button></header>
    {error && <div className="conversation-page__alert">{error}</div>}
    <section className="conversation-shell">
      <aside><div className="conversation-shell__aside-title">{mode === "ai" ? <Sparkles size={17}/> : <Users size={17}/>}<strong>Beszélgetések</strong></div><div>{conversations.map((row) => <button key={row.id} className={row.id === selectedId ? "is-active" : ""} onClick={() => setSelectedId(row.id)}><span>{mode === "ai" ? <Bot size={15}/> : <MessageCircle size={15}/>}</span><div><strong>{row.title}</strong><small>{row.last_message || `${row.message_count || 0} üzenet`}</small></div></button>)}{!conversations.length && <p className="conversation-shell__none">Még nincs beszélgetés.</p>}</div></aside>
      <article><div className="conversation-thread__header"><span>{mode === "ai" ? <Bot/> : <MessageCircle/>}</span><div><strong>{selected?.title || (mode === "ai" ? "Új AI-kérdés" : "Új beszélgetés")}</strong><small>{mode === "ai" ? "Belső tudásbázis + OpenAI Responses API" : "Kleoszalon belső kommunikáció"}</small></div></div><div className="conversation-thread__messages">{messages.map((message) => <div key={message.id} className={`conversation-message conversation-message--${message.sender_type}`}><div>{message.sender_type === "assistant" ? <Bot size={16}/> : <span>{String(message.sender_user_id || "Én").slice(0, 2).toUpperCase()}</span>}</div><article><p>{message.content}</p>{message.metadata?.sources?.length ? <footer>{message.metadata.sources.map((source) => <span key={source.slug}>{source.title}</span>)}</footer> : null}<small>{new Date(message.created_at).toLocaleString("hu-HU")}</small></article></div>)}{!messages.length && <div className="conversation-thread__welcome">{mode === "ai" ? <Sparkles size={32}/> : <MessageCircle size={32}/>}<h2>{mode === "ai" ? "Miben segíthetek?" : "Indítsa el a beszélgetést"}</h2><p>{mode === "ai" ? "Kérdezzen a működési folyamatokról, munkalapokról, pénztárról, készletről vagy HR-ről." : "Az első üzenettel automatikusan létrejön a beszélgetés."}</p></div>}</div><form className="conversation-thread__composer" onSubmit={send}><textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "ai" ? "Kérdezzen a Kleo AI-tól…" : "Írjon üzenetet…"}/><button disabled={!input.trim() || sending}>{sending ? <span className="conversation-spinner"/> : <Send size={18}/>}</button></form>{mode === "ai" && <p className="conversation-thread__notice">Az AI javaslatait a belső szabályzatokkal és vezetői döntésekkel együtt kell alkalmazni.</p>}</article>
    </section>
  </main>;
}
