import axios from "axios";

function norm(v?: string) {
  return (v ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/?$/, "");
}

function detectApiOrigin(): string {
  const env =
    norm(process.env.REACT_APP_API_ORIGIN) ||
    norm(process.env.REACT_APP_API_URL);

  if (env) return env;

  const host = window.location.hostname;
  if (host === "kleoszalon-frontend.onrender.com") {
    return "https://kleoszalon-api-1.onrender.com";
  }
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:5000";
  }
  return norm(window.location.origin) || "";
}

const apiOrigin = detectApiOrigin();
const baseURL = apiOrigin ? `${apiOrigin}/api` : "/api";
const VOICE_ORIGIN_KEY="kleo_public_voice_origin_v1";
const VOICE_ORIGIN_TTL_MS=30*60*1000;

type VoiceOrigin={id:string;created_at:number};
function isPublicBookingPage(){
  if(typeof window==="undefined")return false;
  return /^\/(booking|foglalas|idopontfoglalas)(?:\/|$)/.test(window.location.pathname);
}
function readVoiceOrigin():VoiceOrigin|null{
  try{
    const raw=sessionStorage.getItem(VOICE_ORIGIN_KEY);if(!raw)return null;
    const parsed=JSON.parse(raw) as VoiceOrigin;
    if(!parsed?.id||!parsed?.created_at||Date.now()-Number(parsed.created_at)>VOICE_ORIGIN_TTL_MS){sessionStorage.removeItem(VOICE_ORIGIN_KEY);return null;}
    return parsed;
  }catch{return null;}
}
function saveVoiceOrigin(id:unknown){
  const value=String(id||"").trim();
  if(!value)return;
  try{sessionStorage.setItem(VOICE_ORIGIN_KEY,JSON.stringify({id:value,created_at:Date.now()}));}catch{}
}
function clearVoiceOrigin(){try{sessionStorage.removeItem(VOICE_ORIGIN_KEY);}catch{}}
function urlOf(config:any){return String(config?.url||"");}
function isInterpretUrl(url:string){return url.includes("/public/marketing/booking/voice/interpret");}
function isFinalPublicBookingUrl(url:string){return url.includes("/public/marketing/booking/book")||url.includes("/public/marketing/booking/waitlist");}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // A Voice Booking eredete akkor sem veszhet el, ha a vendég a felismerés után
  // kézzel korrigál szalont, szolgáltatást, szakembert vagy időpontot.
  // Csak a publikus foglalóoldal következő végső book/waitlist műveletéhez kötjük.
  const url=urlOf(config);
  if(isPublicBookingPage()&&isFinalPublicBookingUrl(url)){
    const origin=readVoiceOrigin();
    if(origin){
      let data:any=config.data;
      if(typeof data==="string"){try{data=JSON.parse(data);}catch{data={};}}
      data={...(data||{}),booking_source:"voice",voice_event_id:origin.id};
      config.data=data;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const url=urlOf(response.config);
    if(isInterpretUrl(url)&&response.data?.voice_event_id)saveVoiceOrigin(response.data.voice_event_id);
    if(isPublicBookingPage()&&isFinalPublicBookingUrl(url)&&response.status>=200&&response.status<300)clearVoiceOrigin();
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("API 401: a munkamenet lejárt vagy a token hiányzik.");
    }
    return Promise.reject(error);
  }
);

export default api;
