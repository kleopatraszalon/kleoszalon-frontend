import { useEffect, useRef } from "react";
import api from "../api/api";

type UiEvent={event_type:"click"|"route"|"window"|"dialog"|"submit"|"filter"|"export";route:string;target?:string;label?:string;metadata?:Record<string,unknown>;occurred_at:number};
const MAX_QUEUE=100;
const FLUSH_MS=3000;

function routeNow(){return `${window.location.pathname}${window.location.search}`;}
function authenticated(){try{return Boolean(localStorage.getItem("kleo_token")||localStorage.getItem("token")||sessionStorage.getItem("kleo_token")||sessionStorage.getItem("token"));}catch{return false;}}
function safeLabel(el:Element|null){
  if(!el)return "";
  const html=el as HTMLElement;
  const value=html.getAttribute("aria-label")||html.getAttribute("title")||html.getAttribute("data-testid")||html.textContent||"";
  return String(value).replace(/\s+/g," ").trim().slice(0,180);
}
function safeTarget(el:Element|null){
  if(!el)return "unknown";
  const html=el as HTMLElement;
  return [html.tagName.toLowerCase(),html.getAttribute("role"),html.getAttribute("data-testid"),html.getAttribute("name")].filter(Boolean).join(":").slice(0,180);
}
function interestingClick(el:Element|null){
  return el?.closest("button,a,[role='button'],[role='tab'],[role='menuitem'],input[type='submit'],input[type='button']")||null;
}

export default function UiAuditTelemetry(){
  const queue=useRef<UiEvent[]>([]);
  const flushing=useRef(false);
  const seenDialogs=useRef(new WeakSet<Element>());
  const lastRoute=useRef("");

  useEffect(()=>{
    const push=(event:Omit<UiEvent,"occurred_at">)=>{
      if(!authenticated())return;
      queue.current.push({...event,occurred_at:Date.now()});
      if(queue.current.length>MAX_QUEUE)queue.current.splice(0,queue.current.length-MAX_QUEUE);
    };
    const noteRoute=()=>{
      const route=routeNow();
      if(route===lastRoute.current)return;
      lastRoute.current=route;
      push({event_type:"route",route,target:"router",label:document.title});
    };
    noteRoute();
    const flush=async()=>{
      noteRoute();
      if(!authenticated()){queue.current=[];return;}
      if(flushing.current||!queue.current.length)return;
      flushing.current=true;
      const events=queue.current.splice(0,MAX_QUEUE);
      try{await api.post("/transactions/notifications/pdf-compliance/ui-audit",{events});}
      catch{queue.current.unshift(...events.slice(-MAX_QUEUE));}
      finally{flushing.current=false;}
    };
    const onClick=(event:MouseEvent)=>{
      const el=interestingClick(event.target instanceof Element?event.target:null);
      if(!el)return;
      const type=el instanceof HTMLAnchorElement&&/export|csv|xlsx|pdf|letölt|download/i.test(`${el.href} ${safeLabel(el)}`)?"export":"click";
      push({event_type:type,route:routeNow(),target:safeTarget(el),label:safeLabel(el),metadata:{button:event.button}});
    };
    const onSubmit=(event:SubmitEvent)=>{
      const form=event.target instanceof HTMLFormElement?event.target:null;
      push({event_type:"submit",route:routeNow(),target:safeTarget(form),label:safeLabel(form?.querySelector("button[type='submit'],button:not([type])")||form),metadata:{method:form?.method||""}});
    };
    const onFocus=()=>push({event_type:"window",route:routeNow(),target:"window",label:"focus"});
    const onBlur=()=>push({event_type:"window",route:routeNow(),target:"window",label:"blur"});
    const onVisibility=()=>push({event_type:"window",route:routeNow(),target:"document",label:`visibility:${document.visibilityState}`});
    const onCustom=(event:Event)=>{
      const detail=(event as CustomEvent).detail||{};
      const eventType=String(detail.event_type||"") as UiEvent["event_type"];
      if(!["click","route","window","dialog","submit","filter","export"].includes(eventType))return;
      push({event_type:eventType,route:String(detail.route||routeNow()).slice(0,500),target:String(detail.target||"").slice(0,180),label:String(detail.label||"").slice(0,180),metadata:detail.metadata&&typeof detail.metadata==="object"?detail.metadata:{}});
    };
    const detectDialogs=()=>{
      document.querySelectorAll("dialog[open],[role='dialog'],[aria-modal='true']").forEach(el=>{
        if(seenDialogs.current.has(el))return;
        seenDialogs.current.add(el);
        push({event_type:"dialog",route:routeNow(),target:safeTarget(el),label:safeLabel(el.querySelector("h1,h2,h3")||el),metadata:{state:"open"}});
      });
    };
    document.addEventListener("click",onClick,true);
    document.addEventListener("submit",onSubmit,true);
    window.addEventListener("focus",onFocus);
    window.addEventListener("blur",onBlur);
    document.addEventListener("visibilitychange",onVisibility);
    window.addEventListener("popstate",noteRoute);
    window.addEventListener("kleo:ui-audit",onCustom as EventListener);
    const observer=new MutationObserver(()=>{detectDialogs();noteRoute();});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["open","aria-modal","role"]});detectDialogs();
    const timer=window.setInterval(()=>void flush(),FLUSH_MS);
    const onPageHide=()=>{void flush();};window.addEventListener("pagehide",onPageHide);
    return()=>{
      window.clearInterval(timer);observer.disconnect();void flush();
      document.removeEventListener("click",onClick,true);document.removeEventListener("submit",onSubmit,true);
      window.removeEventListener("focus",onFocus);window.removeEventListener("blur",onBlur);document.removeEventListener("visibilitychange",onVisibility);
      window.removeEventListener("popstate",noteRoute);window.removeEventListener("kleo:ui-audit",onCustom as EventListener);window.removeEventListener("pagehide",onPageHide);
    };
  },[]);
  return null;
}
