import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Bot, ChevronDown, Loader2, MessageCircle, Send, Trash2, UserRound, Users, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../api";
import "./AiHelpChat.css";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Mode = "ai" | "staff";
type Coworker = { id: string; full_name: string; email?: string };
type Conversation = { id: string; other_name: string; last_message?: string; last_message_at?: string };
type StaffMessage = { id: string | number; sender_key: string; sender_name?: string; content: string; created_at: string; is_mine?: boolean };
type UsageStats = {
  global: { request_count: number; estimated_cost_usd: number };
  mine: { request_count: number; estimated_cost_usd: number };
  limits: { monthlyBudgetUsd: number; userMonthlyBudgetUsd: number; userMonthlyRequestLimit: number };
};

const welcome: ChatMessage = {
  role: "assistant",
  content: "Szia! Én vagyok a Kleoszalon VIR használati asszisztense. Kérdezz rá bármelyik menüre vagy folyamatra, például: „Hol tudok bevételezni?” vagy „Hogyan zárok le egy munkalapot?”",
};

export default function AiHelpChat({ pageTitle }: { pageTitle?: string }) {
  const location = useLocation();
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
  const [conversationId, setConversationId] = useState<string>("");
  const [conversationName, setConversationName] = useState<string>("");
  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>([]);
  const [staffInput, setStaffInput] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const storageKey = "kleo.aiHelp.history.v1";
  const locationName = localStorage.getItem("kleo_location_name") || "Minden telephely";
  const role = localStorage.getItem("kleo_role") || "";

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (Array.isArray(saved) && saved.length) setMessages(saved.slice(-20));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20))); } catch {}
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, staffMessages, open]);

  useEffect(() => {
    if (!open) return;
    if (mode === "ai") loadStats();
    if (mode === "staff") loadStaffHome();
  }, [open, mode]);

  useEffect(() => {
    if (!open || mode !== "staff" || !conversationId) return;
    loadStaffMessages(conversationId);
    const timer = window.setInterval(() => loadStaffMessages(conversationId), 5000);
    return () => window.clearInterval(timer);
  }, [open, mode, conversationId]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function loadStats() {
    try { const { data } = await api.get("/api/transactions/ai-support/stats"); setStats(data); } catch {}
  }

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages: ChatMessage[] = [...messages, userMessage].slice(-10);
    setMessages(nextMessages); setInput(""); setError(""); setLoading(true);
    try {
      const response = await api.post("/api/transactions/ai-support/chat", {
        messages: nextMessages,
        context: { pathname: location.pathname, page_title: pageTitle || document.title || "Kleoszalon VIR", location_name: locationName, role },
      });
      const assistantMessage: ChatMessage = { role: "assistant", content: String(response.data?.answer || "Nem érkezett válasz.") };
      setMessages(prev => [...prev, assistantMessage].slice(-20)); loadStats();
    } catch (err: any) {
      const data = err?.response?.data || {};
      setError([String(data?.message || "Az AI támogatás most nem elérhető."), data?.detail ? String(data.detail) : "", data?.code ? `Hibakód: ${data.code}` : ""].filter(Boolean).join("\n"));
    } finally { setLoading(false); }
  }

  function clearHistory() {
    setMessages([welcome]); setError("");
    try { localStorage.removeItem(storageKey); } catch {}
  }

  async function loadStaffHome() {
    try {
      const [people, convs] = await Promise.all([api.get("/api/transactions/staff-chat/coworkers"), api.get("/api/transactions/staff-chat/conversations")]);
      setCoworkers(people.data || []); setConversations(convs.data || []);
    } catch (err: any) { setError(err?.response?.data?.message || "A munkatársi chat nem tölthető be."); }
  }

  async function startConversation(coworker: Coworker) {
    setStaffLoading(true); setError("");
    try {
      const { data } = await api.post("/api/transactions/staff-chat/conversations", { coworker_id: coworker.id });
      setConversationId(String(data.id)); setConversationName(coworker.full_name);
      await loadStaffMessages(String(data.id)); await loadStaffHome();
    } catch (err: any) { setError(err?.response?.data?.message || "A beszélgetés nem indítható."); }
    finally { setStaffLoading(false); }
  }

  async function openConversation(conv: Conversation) {
    setConversationId(String(conv.id)); setConversationName(conv.other_name || "Munkatárs"); await loadStaffMessages(String(conv.id));
  }

  async function loadStaffMessages(id: string) {
    try { const { data } = await api.get(`/api/transactions/staff-chat/conversations/${id}/messages`); setStaffMessages(data || []); } catch {}
  }

  async function sendStaffMessage(e?: FormEvent) {
    e?.preventDefault();
    const text = staffInput.trim();
    if (!text || !conversationId || staffLoading) return;
    setStaffLoading(true); setError("");
    try {
      await api.post(`/api/transactions/staff-chat/conversations/${conversationId}/messages`, { content: text });
      setStaffInput(""); await loadStaffMessages(conversationId); await loadStaffHome();
    } catch (err: any) { setError(err?.response?.data?.message || "Az üzenet nem küldhető el."); }
    finally { setStaffLoading(false); }
  }

  return (
    <div className={`ai-help ${open ? "is-open" : ""}`}>
      {open && (
        <section className="ai-help-panel" aria-label="Kleo kommunikációs központ">
          <header className="ai-help-header">
            <div className="ai-help-title"><span>{mode === "ai" ? <Bot size={19}/> : <Users size={19}/>}</span><div><b>Kleo Segítség & Chat</b><small>{mode === "ai" ? "AI használati támogatás" : "Belső munkatársi üzenetek"}</small></div></div>
            <div className="ai-help-actions">{mode === "ai" && <button type="button" onClick={clearHistory} title="AI beszélgetés törlése"><Trash2 size={16}/></button>}<button type="button" onClick={() => setOpen(false)} title="Bezárás"><ChevronDown size={18}/></button></div>
          </header>
          <div className="ai-help-mode-tabs">
            <button className={mode === "ai" ? "active" : ""} onClick={() => { setMode("ai"); setError(""); }}><Bot size={16}/> AI Segítő</button>
            <button className={mode === "staff" ? "active" : ""} onClick={() => { setMode("staff"); setError(""); }}><UserRound size={16}/> Munkatárs</button>
          </div>
          {mode === "ai" ? <>
            <div className="ai-help-context"><span>Aktuális oldal: <b>{pageTitle || location.pathname}</b></span><button onClick={() => setShowStats(v => !v)} title="AI használati statisztika"><BarChart3 size={15}/></button></div>
            {showStats && stats && <div className="ai-usage-card"><div><b>{stats.mine.request_count}</b><span>saját kérés / hó</span></div><div><b>${stats.mine.estimated_cost_usd.toFixed(3)}</b><span>saját költség</span></div><div><b>${stats.global.estimated_cost_usd.toFixed(3)}</b><span>összes AI költség</span></div><small>Limit: {stats.limits.userMonthlyRequestLimit} kérés · ${stats.limits.userMonthlyBudgetUsd}/fő · ${stats.limits.monthlyBudgetUsd}/hó</small></div>}
            <div className="ai-help-messages">{messages.map((m, index) => <div key={`${m.role}-${index}`} className={`ai-help-message ${m.role}`}>{m.role === "assistant" && <Bot size={16}/>}<p>{m.content}</p></div>)}{loading && <div className="ai-help-message assistant"><Loader2 className="ai-help-spin" size={16}/><p>Gondolkodom…</p></div>}{error && <div className="ai-help-error" style={{ whiteSpace: "pre-wrap" }}>{error}</div>}<div ref={endRef}/></div>
            <form className="ai-help-form" onSubmit={sendMessage}><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (canSend) sendMessage(); } }} placeholder="Kérdezz a rendszer használatáról…" rows={2} maxLength={4000}/><button type="submit" disabled={!canSend} aria-label="Küldés"><Send size={18}/></button></form>
            <footer>Az AI használata havi és felhasználói költségkorláttal védett.</footer>
          </> : <>
            {!conversationId ? <div className="staff-chat-home"><h4>Beszélgetések</h4>{conversations.length > 0 && <div className="staff-conversation-list">{conversations.map(c => <button key={c.id} onClick={() => openConversation(c)}><b>{c.other_name}</b><span>{c.last_message || "Beszélgetés megnyitása"}</span></button>)}</div>}<h4>Új beszélgetés</h4><div className="staff-coworker-list">{coworkers.map(c => <button key={c.id} onClick={() => startConversation(c)}><UserRound size={17}/><span><b>{c.full_name}</b><small>{c.email || "Munkatárs"}</small></span></button>)}</div>{staffLoading && <div className="staff-loading"><Loader2 className="ai-help-spin" size={17}/> Betöltés…</div>}{error && <div className="ai-help-error">{error}</div>}</div> : <><div className="staff-chat-bar"><button onClick={() => { setConversationId(""); setConversationName(""); }}>‹ Vissza</button><b>{conversationName}</b></div><div className="ai-help-messages staff-messages">{staffMessages.map(m => <div key={m.id} className={`ai-help-message ${m.is_mine ? "user" : "assistant"}`}><p><small>{m.sender_name}</small>{m.content}</p></div>)}{error && <div className="ai-help-error">{error}</div>}<div ref={endRef}/></div><form className="ai-help-form" onSubmit={sendStaffMessage}><textarea value={staffInput} onChange={e => setStaffInput(e.target.value)} placeholder={`Üzenet ${conversationName} részére…`} rows={2} maxLength={4000}/><button type="submit" disabled={!staffInput.trim() || staffLoading}><Send size={18}/></button></form><footer>Az üzenetek a VIR belső rendszerében tárolódnak.</footer></>}
          </>}
        </section>
      )}
      <button className="ai-help-launcher" type="button" onClick={() => setOpen(v => !v)} aria-label={open ? "Chat bezárása" : "Segítség és chat megnyitása"}>{open ? <X size={22}/> : <><MessageCircle size={23}/><span>Segítség & Chat</span></>}</button>
    </div>
  );
}
