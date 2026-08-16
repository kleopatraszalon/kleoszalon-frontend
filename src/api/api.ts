import axios from "axios";
import { idempotencyKeyFor } from "../utils/financialIdempotency";

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
const READ_RETRY_MAX_ATTEMPTS=3;
const READ_RETRY_BASE_DELAY_MS=750;
const READ_RETRY_MAX_WINDOW_MS=60_000;

type VoiceOrigin={id:string;created_at:number};
type RetryableConfig={
  method?:string;
  __kleoReadRetryCount?:number;
  __kleoReadRetryStartedAt?:number;
};
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

export function isRetryableReadFailure(error:any){
  const method=String(error?.config?.method||"get").toLowerCase();
  if(method!=="get"&&method!=="head")return false;
  if(error?.code==="ERR_CANCELED"||error?.name==="CanceledError")return false;
  const status=Number(error?.response?.status||0);
  return !status||status===408||status===429||status===502||status===503||status===504;
}

export function nextReadRetryDelayMs(attempt:number){
  const safe=Math.max(1,Math.min(READ_RETRY_MAX_ATTEMPTS,Number(attempt)||1));
  return READ_RETRY_BASE_DELAY_MS*Math.pow(2,safe-1);
}

function sleep(ms:number){return new Promise(resolve=>setTimeout(resolve,ms));}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // A canonical kliens baseURL-je már /api-ra végződik. Több régi komponens még
  // /api/... alakú útvonalat ad át; ezt itt központilag normalizáljuk, hogy soha
  // ne keletkezzen /api/api/... 404. Abszolút URL-hez nem nyúlunk.
  const requestUrl=String(config.url||"");
  const configuredBase=String(config.baseURL||"");
  if(!/^https?:\/\//i.test(requestUrl)&&/\/api\/?$/i.test(configuredBase)&&/^\/api(?:\/|$)/i.test(requestUrl)){
    config.url=requestUrl.replace(/^\/api(?=\/|$)/i,"")||"/";
  }

  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const idempotencyKey=idempotencyKeyFor(`${String(config.baseURL||"")}${String(config.url||"")}`,config.method);
  if(idempotencyKey&&!config.headers?.["Idempotency-Key"]){
    config.headers=config.headers||{};
    config.headers["Idempotency-Key"]=idempotencyKey;
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
    const responseData:any=response.data;
    if(isInterpretUrl(url)&&responseData?.voice_event_id)saveVoiceOrigin(responseData.voice_event_id);
    if(isPublicBookingPage()&&isFinalPublicBookingUrl(url)&&response.status>=200&&response.status<300)clearVoiceOrigin();
    return response;
  },
  async (error) => {
    if (error?.response?.status === 401) {
      console.warn("API 401: a munkamenet lejárt vagy a token hiányzik.");
    }

    // Olvasási kérésnél átmeneti hálózati/edge hiba után kontrolláltan újrapróbálunk.
    // Írási műveletet itt szándékosan nem ismétlünk: azoknál az Idempotency-Key a
    // szerveroldali biztonsági garancia, a felhasználó pedig explicit folytathatja.
    if(isRetryableReadFailure(error)&&error?.config){
      const config=error.config as typeof error.config&RetryableConfig;
      const now=Date.now();
      const started=Number(config.__kleoReadRetryStartedAt||now);
      const count=Number(config.__kleoReadRetryCount||0);
      const nextAttempt=count+1;
      const delay=nextReadRetryDelayMs(nextAttempt);
      if(nextAttempt<=READ_RETRY_MAX_ATTEMPTS&&now-started+delay<READ_RETRY_MAX_WINDOW_MS){
        config.__kleoReadRetryStartedAt=started;
        config.__kleoReadRetryCount=nextAttempt;
        await sleep(delay);
        return api.request(config);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
