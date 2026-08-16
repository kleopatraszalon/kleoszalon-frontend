import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Bot, ChevronDown, Loader2, MessageCircle, Search, Send, Trash2, UserRound, Users } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../api";
import { useCapabilities } from "../hooks/useCapabilities";
import "./AiHelpChat.css";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Mode = "ai" | "staff";
type Coworker = { id: string; full_name: string; email?: string; online?: boolean; last_seen_at?: string | null };
type Conversation = { id: string; other_name: string; last_message?: string; last_message_at?: string; unread_count?: number; other_online?: boolean | null; other_last_seen_at?: string | null; is_group?: boolean };
type StaffMessage = { id: string | number; sender_key: string; sender_name?: string; content: string; created_at: string; is_mine?: boolean };
type UsageStats = { global: { request_count: number; estimated_cost_usd: number }; mine: { request_count: number; estimated_cost_usd: number }; limits: { monthlyBudgetUsd: number; userMonthlyBudgetUsd: number; userMonthlyRequestLimit: number } };
type UnreadCountResponse = { unread_count?: number };

const welcome: ChatMessage = { role: "assistant", content: "Szia! Én vagyok a Kleoszalon VIR használati asszisztense. Kérdezz rá bármelyik menüre vagy folyamatra." };
const seenText = (value?: string | null) => {
  if (!value) return "még nem aktív";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "nem ismert";
  return `utoljára aktív: ${new Intl.DateTimeFormat("hu-HU", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d)}`;
};

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChatMessage>;
  return (candidate.role === "user" || candidate.role === "assistant") && typeof candidate.content === "string";
};

export default function AiHelpChat({ pageTitle }: { pageTitle?: string }) {
  const location = useLocation();
  const { feature, loading: capabilityLoading } = useCapabilities();
  const canAi = feature("ai_use");
  const canAiStats = feature("ai_stats");
  const canStaff = feature("staff_chat");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("ai");
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [conversationName, setConversationName] = useState("");
  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>([]);
  const [staffInput, setStaffInput] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [groupMode, setGroupMode] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  const storageKey = "kleo.aiHelp.history.v1";
  const locationName = localStorage.getItem("kleo_location_name") || "Minden telephely";
  const role = localStorage.getItem("kleo_role") || "";

  useEffect(() => {
    if (!capabilityLoading && !canAi && canStaff) setMode("staff");
    if (!capabilityLoading && canAi && !canStaff) setMode("ai");
  }, [capabilityLoading, canAi, canStaff]);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (Array.isArray(saved)) {
        const validMessages = saved.filter(isChatMessage).slice(-20);
        if (validMessages.length) setMessages(validMessages);
      }
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20))); } catch {}; if (open) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, staffMessages, open]);

  useEffect(() => {
    if (capabilityLoading || !canStaff) { setUnreadCount(0); return; }
    const tick = async () => {
      try {
        await api.post("/api/transactions/staff-chat/presence");
        const { data } = await api.get<UnreadCountResponse>("/api/transactions/staff-chat/unread-count");
        setUnreadCount(Number(data?.unread_count || 0));
      } catch {}
    };
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, [capabilityLoading, canStaff]);

  useEffect(() => {
    if (!open) return;
    if (mode === "ai" && canAiStats) loadStats();
    if (mode === "staff" && canStaff) loadStaffHome();
  }, [open, mode, canAiStats, canStaff]);
  useEffect(() => { if (!open || mode !== "staff" || !canStaff || !conversationId) return; loadStaffMessages(conversationId); const timer = window.setInterval(() => loadStaffMessages(conversationId), 5000); return () => window.clearInterval(timer); }, [open, mode, canStaff, conversationId]);
  useEffect(() => { if (!open || mode !== "staff" || !canStaff) return; const timer = window.setTimeout(() => loadStaffHome(staffSearch), 250); return () => window.clearTimeout(timer); }, [staffSearch, open, mode, canStaff]);

  const canSend = useMemo(() => canAi && input.trim().length > 0 && !loading, [canAi, input, loading]);
  async function loadStats() { if (!canAiStats) return; try { const { data } = await api.get("/api/transactions/ai-support/stats"); setStats(data); } catch {} }
  async function sendMessage(e?: FormEvent) {
    e?.preventDefault(); const text = input.trim(); if (!canAi || !text || loading) return;
    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages: ChatMessage[] = messages.concat(userMessage).slice(-10);
    setMessages(nextMessages); setInput(""); setError(""); setLoading(true);
    try {
      const response = await api.post("/api/transactions/ai-support/chat", { messages: nextMessages, context: { pathname: location.pathname, page_title: pageTitle || document.title || "Kleoszalon VIR", location_name: locationName, role } });
      const assistantMessage: ChatMessage = { role: "assistant", content: String(response.data?.answer || "Nem érkezett válasz.") };
      setMessages(prev => prev.concat(assistantMessage).slice(-20));
      if (canAiStats) loadStats();
    }
    catch (err: any) { const data = err?.response?.data || {}; setError([String(data?.message || "Az AI támogatás most nem elérhető."), data?.detail ? String(data.detail) : "", data?.code ? `Hibakód: ${data.code}` : ""].filter(Boolean).join("\n")); }
    finally { setLoading(false); }
  }
  function clearHistory() { setMessages([welcome]); setError(""); try { localStorage.removeItem(storageKey); } catch {} }

  async function loadStaffHome(q = staffSearch) {
    if (!canStaff) return;
    try {
      const suffix = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const [people, convs, unread] = await Promise.all([
        api.get(`/api/transactions/staff-chat/coworkers${suffix}`),
        api.get(`/api/transactions/staff-chat/conversations${suffix}`),
        api.get<UnreadCountResponse>("/api/transactions/staff-chat/unread-count"),
      ]);
      setCoworkers(people.data || []); setConversations(convs.data || []); setUnreadCount(Number(unread.data?.unread_count || 0));
    } catch (err: any) { setError(err?.response?.data?.message || err?.response?.data?.error || "A munkatársi chat nem tölthető be."); }
  }
  async function startConversation(coworker: Coworker) {
    if (!canStaff) return;
    setStaffLoading(true); setError("");
    try { const { data } = await api.post("/api/transactions/staff-chat/conversations", { coworker_id: coworker.id }); setConversationId(String(data.id)); setConversationName(coworker.full_name); await loadStaffMessages(String(data.id)); await loadStaffHome(); }
    catch (err: any) { setError(err?.response?.data?.message || err?.response?.data?.error || "A beszélgetés nem indítható."); }
    finally { setStaffLoading(false); }
  }
  async function createGroup() {
    if (!canStaff) return;
    setStaffLoading(true); setError("");
    try { const { data } = await api.post("/api/transactions/staff-chat/groups", { title: groupTitle, coworker_ids: groupMembers }); setGroupMode(false); setGroupTitle(""); setGroupMembers([]); setConversationId(String(data.id)); setConversationName(String(data.title || "Csoport")); await loadStaffMessages(String(data.id)); await loadStaffHome(); }
    catch (err: any) { setError(err?.response?.data?.message || err?.response?.data?.error || "A csoport nem hozható létre."); }
    finally { setStaffLoading(false); }
  }
  async function openConversation(conv: Conversation) { if (!canStaff) return; setConversationId(String(conv.id)); setConversationName(conv.other_name || "Beszélgetés"); await loadStaffMessages(String(conv.id)); await loadStaffHome(); }
  async function loadStaffMessages(id: string) { if (!canStaff) return; try { const { data } = await api.get(`/api/transactions/staff-chat/conversations/${id}/messages`); setStaffMessages(data || []); const unread = await api.get<UnreadCountResponse>("/api/transactions/staff-chat/unread-count"); setUnreadCount(Number(unread.data?.unread_count || 0)); } catch {} }
  async function sendStaffMessage(e?: FormEvent) { e?.preventDefault(); const text = staffInput.trim(); if (!canStaff || !text || !conversationId || staffLoading) return; setStaffLoading(true); setError(""); try { await api.post(`/api/transactions/staff-chat/conversations/${conversationId}/messages`, { content: text }); setStaffInput(""); await loadStaffMessages(conversationId); await loadStaffHome(); } catch (err: any) { setError(err?.response?.data?.message || err?.response?.data?.error || "Az üzenet nem küldhető el."); } finally { setStaffLoading(false); } }

  if (!capabilityLoading && !canAi && !canStaff) return null;

  return <div className={`ai-help ${open ? "is-open" : ""}`}>
    {open && <section className="ai-help-panel" aria-label="Kleo kommunikációs központ">
      <header className="ai-help-header"><div className="ai-help-title"><span>{mode === "ai" ? <Bot size={19}/> : <Users size={19}/>}</span><div><b>Kleo Segítség & Chat</b><small>{mode === "ai" ? "AI használati támogatás" : "Belső munkatársi üzenetek"}</small></div></div><div className="ai-help-actions">{mode === "ai" && canAi && <button type="button" onClick={clearHistory} title="AI beszélgetés törlése"><Trash2 size={16}/></button>}<button type="button" onClick={() => setOpen(false)} title="Bezárás"><ChevronDown size={18}/></button></div></header>
      <div className="ai-help-mode-tabs">{canAi && <button className={mode === "ai" ? "active" : ""} onClick={() => { setMode("ai"); setError(""); }}><Bot size={16}/> AI Segítő</button>}{canStaff && <button className={mode === "staff" ? "active" : ""} onClick={() => { setMode("staff"); setError(""); }}><UserRound size={16}/> Munkatárs {unreadCount > 0 && <em>{unreadCount}</em>}</button>}</div>
      {mode === "ai" && canAi ? <><div className="ai-help-context"><span>Aktuális oldal: <b>{pageTitle || location.pathname}</b></span>{canAiStats && <button onClick={() => setShowStats(v => !v)} title="AI használati statisztika"><BarChart3 size={15}/></button>}</div>{canAiStats && showStats && stats && <div className="ai-usage-card"><div><b>{stats.mine.request_count}</b><span>saját kérés / hó</span></div><div><b>${stats.mine.estimated_cost_usd.toFixed(3)}</b><span>saját költség</span></div><div><b>${stats.global.estimated_cost_usd.toFixed(3)}</b><span>összes AI költség</span></div><small>Limit: {stats.limits.userMonthlyRequestLimit} kérés · ${stats.limits.userMonthlyBudgetUsd}/fő · ${stats.limits.monthlyBudgetUsd}/hó</small></div>}<div className="ai-help-messages">{messages.map((m, index) => <div key={`${m.role}-${index}`} className={`ai-help-message ${m.role}`}>{m.role === "assistant" && <Bot size={16}/>}<p>{m.content}</p></div>)}{loading && <div className="ai-help-message assistant"><Loader2 className="ai-help-spin" size={16}/><p>Gondolkodom…</p></div>}{error && <div className="ai-help-error" style={{whiteSpace:"pre-wrap"}}>{error}</div>}<div ref={endRef}/></div><form className="ai-help-form" onSubmit={sendMessage}><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Kérdezz a rendszer használatáról…" rows={2} maxLength={4000}/><button disabled={!canSend}><Send size={18}/></button></form><footer>Az AI használata havi és felhasználói költségkorláttal védett.</footer></> : <>
        {!conversationId ? <div className="staff-chat-home"><div className="staff-search"><Search size={15}/><input value={staffSearch} onChange={e=>setStaffSearch(e.target.value)} placeholder="Munkatárs vagy üzenet keresése…"/></div><div className="staff-chat-section-head"><h4>Beszélgetések</h4><button onClick={()=>setGroupMode(v=>!v)}><Users size={15}/> Csoport</button></div>{groupMode && <div className="staff-group-box"><input value={groupTitle} onChange={e=>setGroupTitle(e.target.value)} placeholder="Csoport neve"/><div>{coworkers.map(c=><label key={c.id}><input type="checkbox" checked={groupMembers.includes(c.id)} onChange={()=>setGroupMembers(prev=>prev.includes(c.id)?prev.filter(x=>x!==c.id):[...prev,c.id])}/><span>{c.full_name}</span></label>)}</div><button disabled={!groupTitle.trim()||groupMembers.length<2||staffLoading} onClick={createGroup}>Csoport létrehozása</button></div>}{conversations.length > 0 && <div className="staff-conversation-list">{conversations.map(c => <button key={c.id} onClick={() => openConversation(c)}><span className="staff-presence-dot" data-online={c.other_online ? "1":"0"}/><span><b>{c.other_name}</b><small>{c.is_group ? "Csoport" : c.other_online ? "online" : seenText(c.other_last_seen_at)}</small><span>{c.last_message || "Beszélgetés megnyitása"}</span></span>{Number(c.unread_count||0)>0&&<em>{c.unread_count}</em>}</button>)}</div>}<h4>Új beszélgetés</h4><div className="staff-coworker-list">{coworkers.map(c => <button key={c.id} onClick={() => startConversation(c)}><span className="staff-presence-dot" data-online={c.online ? "1":"0"}/><UserRound size={17}/><span><b>{c.full_name}</b><small>{c.online ? "online" : seenText(c.last_seen_at)}</small></span></button>)}</div>{staffLoading&&<div className="staff-loading"><Loader2 className="ai-help-spin" size={17}/> Betöltés…</div>}{error&&<div className="ai-help-error">{error}</div>}</div> : <><div className="staff-chat-bar"><button onClick={()=>{setConversationId("");setConversationName("");loadStaffHome();}}>‹ Vissza</button><b>{conversationName}</b></div><div className="ai-help-messages staff-messages">{staffMessages.map(m=><div key={m.id} className={`ai-help-message ${m.is_mine?"user":"assistant"}`}><p><small>{m.sender_name}</small>{m.content}</p></div>)}{error&&<div className="ai-help-error">{error}</div>}<div ref={endRef}/></div><form className="ai-help-form" onSubmit={sendStaffMessage}><textarea value={staffInput} onChange={e=>setStaffInput(e.target.value)} placeholder={`Üzenet ${conversationName} részére…`} rows={2} maxLength={4000}/><button disabled={!staffInput.trim()||staffLoading}><Send size={18}/></button></form></>}
      </>}
    </section>}
    <button className="ai-help-launcher" onClick={() => setOpen(v => !v)}><MessageCircle size={19}/> <span>Segítség & Chat</span>{canStaff && unreadCount>0&&<em>{unreadCount}</em>}</button>
  </div>;
}