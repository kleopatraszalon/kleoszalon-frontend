import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown, Loader2, MessageCircle, Send, Trash2, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../api";
import "./AiHelpChat.css";

type ChatMessage = { role: "user" | "assistant"; content: string };

const welcome: ChatMessage = {
  role: "assistant",
  content: "Szia! Én vagyok a Kleoszalon VIR használati asszisztense. Kérdezz rá bármelyik menüre vagy folyamatra, például: „Hol tudok bevételezni?” vagy „Hogyan zárok le egy munkalapot?”",
};

export default function AiHelpChat({ pageTitle }: { pageTitle?: string }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
  }, [messages, open]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages: ChatMessage[] = [...messages, userMessage].slice(-10);
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/transactions/ai-support/chat", {
        messages: nextMessages,
        context: {
          pathname: location.pathname,
          page_title: pageTitle || document.title || "Kleoszalon VIR",
          location_name: locationName,
          role,
        },
      });
      const answer = String(response.data?.answer || "Nem érkezett válasz.");
      const assistantMessage: ChatMessage = { role: "assistant", content: answer };
      setMessages(prev => [...prev, assistantMessage].slice(-20));
    } catch (err: any) {
      const data = err?.response?.data || {};
      const base = String(data?.message || "Az AI támogatás most nem elérhető.");
      const detail = data?.detail ? String(data.detail) : "";
      const code = data?.code ? String(data.code) : "";
      setError([base, detail, code ? `Hibakód: ${code}` : ""].filter(Boolean).join("\n"));
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([welcome]);
    setError("");
    try { localStorage.removeItem(storageKey); } catch {}
  }

  return (
    <div className={`ai-help ${open ? "is-open" : ""}`}>
      {open && (
        <section className="ai-help-panel" aria-label="AI használati asszisztens">
          <header className="ai-help-header">
            <div className="ai-help-title"><span><Bot size={19}/></span><div><b>Kleo AI Segítő</b><small>VIR használati támogatás</small></div></div>
            <div className="ai-help-actions">
              <button type="button" onClick={clearHistory} title="Beszélgetés törlése"><Trash2 size={16}/></button>
              <button type="button" onClick={() => setOpen(false)} title="Bezárás"><ChevronDown size={18}/></button>
            </div>
          </header>

          <div className="ai-help-context">Aktuális oldal: <b>{pageTitle || location.pathname}</b></div>

          <div className="ai-help-messages">
            {messages.map((m, index) => (
              <div key={`${m.role}-${index}`} className={`ai-help-message ${m.role}`}>
                {m.role === "assistant" && <Bot size={16}/>}<p>{m.content}</p>
              </div>
            ))}
            {loading && <div className="ai-help-message assistant"><Loader2 className="ai-help-spin" size={16}/><p>Gondolkodom…</p></div>}
            {error && <div className="ai-help-error" style={{ whiteSpace: "pre-wrap" }}>{error}</div>}
            <div ref={endRef}/>
          </div>

          <form className="ai-help-form" onSubmit={sendMessage}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) sendMessage();
                }
              }}
              placeholder="Kérdezz a rendszer használatáról…"
              rows={2}
              maxLength={4000}
            />
            <button type="submit" disabled={!canSend} aria-label="Küldés"><Send size={18}/></button>
          </form>
          <footer>Az AI válasza tájékoztató jellegű; ellenőrizd a fontos műveleteket.</footer>
        </section>
      )}

      <button className="ai-help-launcher" type="button" onClick={() => setOpen(v => !v)} aria-label={open ? "AI segítő bezárása" : "AI segítő megnyitása"}>
        {open ? <X size={22}/> : <><MessageCircle size={23}/><span>AI Segítő</span></>}
      </button>
    </div>
  );
}
