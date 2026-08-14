import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bell, Check, ExternalLink, RefreshCw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./NotificationBell.css";

type Item = { key:string; severity:"info"|"warning"|"critical"; title:string; detail:string; route?:string; read:boolean; created_at:string };

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState<Item[]>([]);
  const [unread,setUnread]=useState(0);
  const [loading,setLoading]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    try { const r=await api.get("/transactions/notifications"); setItems(r.data?.items||[]); setUnread(Number(r.data?.unread_count||0)); }
    catch { setItems([]); setUnread(0); }
    finally { setLoading(false); }
  },[]);

  // Az értesítésszám nem blokkolja a kezdőképernyő kritikus API-kéréseit.
  // Kézi megnyitáskor továbbra is azonnal frissítünk.
  useEffect(()=>{ const first=window.setTimeout(()=>void load(),900); const id=window.setInterval(()=>void load(),60000); return()=>{window.clearTimeout(first);window.clearInterval(id)}; },[load]);

  const openItem=async(item:Item)=>{
    if(!item.read){try{await api.post(`/transactions/notifications/${encodeURIComponent(item.key)}/read`)}catch{} setUnread(v=>Math.max(0,v-1));}
    setOpen(false); if(item.route)navigate(item.route);
  };

  const dismiss=async(item:Item)=>{try{await api.post(`/transactions/notifications/${encodeURIComponent(item.key)}/dismiss`)}catch{} setItems(x=>x.filter(i=>i.key!==item.key)); if(!item.read)setUnread(v=>Math.max(0,v-1));};

  return <div className="notification-bell-wrap">
    <button className="topbar-notification notification-bell-button" type="button" onClick={()=>{setOpen(v=>!v); if(!open)void load();}} aria-label="Értesítések">
      <Bell size={18}/>{unread>0&&<span className="notification-count">{unread>99?"99+":unread}</span>}
    </button>
    {open&&<div className="notification-popover">
      <header><div><small>ÉRTESÍTÉSI KÖZPONT</small><h3>Aktív figyelmeztetések</h3></div><button onClick={()=>setOpen(false)}><X/></button></header>
      <div className="notification-popover-toolbar"><span>{unread} olvasatlan</span><button onClick={()=>void load()}><RefreshCw className={loading?"spin":""}/>Frissítés</button></div>
      <div className="notification-popover-list">
        {items.slice(0,8).map(item=><article key={item.key} className={`severity-${item.severity} ${item.read?"read":""}`}>
          <button className="notification-popover-main" onClick={()=>void openItem(item)}><AlertTriangle/><span><b>{item.title}</b><small>{item.detail}</small></span>{!item.read&&<i/>}</button>
          <button className="notification-popover-dismiss" onClick={()=>void dismiss(item)} title="Elrejtés"><Check/></button>
        </article>)}
        {!loading&&!items.length&&<div className="notification-popover-empty"><Check/><b>Nincs aktív értesítés</b><small>Minden rendben.</small></div>}
      </div>
      <footer><button onClick={()=>{setOpen(false);navigate("/dashboard/notifications")}}><ExternalLink/>Teljes értesítési központ</button></footer>
    </div>}
  </div>;
}
