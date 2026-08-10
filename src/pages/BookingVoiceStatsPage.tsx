import React,{useCallback,useEffect,useMemo,useState}from"react";
import{Activity,BrainCircuit,CalendarRange,CheckCircle2,Mic2,RefreshCw,Sparkles,TrendingUp,UsersRound}from"lucide-react";
import{Bar,BarChart,CartesianGrid,Legend,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis}from"recharts";
import api from"../api/api";
import"./BookingVoiceStatsPage.css";

type Location={id:string;name:string};
type Stats={
 range:{days:number;from:string;to:string;location_id:string|null};
 summary:{voice_requests:number;recognized:number;recognition_rate:number;ai_used:number;ai_share:number;voice_book_intents:number;voice_bookings:number;conversion_rate:number;online_bookings:number;voice_booking_share:number;voice_waitlist:number;online_waitlist:number;avg_transcript_length:number};
 ai:{calls:number;input_tokens:number;output_tokens:number;estimated_cost_usd:number};
 intents:Array<{intent:string;total:number;recognized:number;ai_used:number}>;
 locations:Array<{location_id:string;name:string;voice_requests:number;recognized:number;voice_bookings:number;online_bookings:number;recognition_rate:number;conversion_rate:number}>;
 daily:Array<{date:string;voice_requests:number;recognized:number;ai_used:number;voice_bookings:number;online_bookings:number}>;
 top_services:Array<{service_id:string;name:string;requests:number}>;
 recent:Array<{id:string;created_at:string;intent:string;recognized:boolean;ai_used:boolean;transcript_length:number;requested_date?:string|null;requested_time?:string|null;preferred_period?:string|null;missing_fields:string[];location_name?:string|null;employee_name?:string|null;service_count:number}>;
 privacy:{transcripts_stored:boolean;recent_transcripts_exposed:boolean};
};

const num=(v:unknown)=>Number(v||0).toLocaleString("hu-HU");
const pct=(v:unknown)=>`${Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:1})}%`;
const intentLabel=(v:string)=>v==="book"?"Foglalás":v==="waitlist"?"Várólista":v==="cancel"?"Lemondás":v;
const missingLabel=(v:string)=>v==="location"?"szalon":v==="services"?"szolgáltatás":v==="date"?"dátum":v;

export default function BookingVoiceStatsPage(){
 const[days,setDays]=useState(30);
 const[locationId,setLocationId]=useState("");
 const[locations,setLocations]=useState<Location[]>([]);
 const[data,setData]=useState<Stats|null>(null);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");

 useEffect(()=>{api.get("/public/marketing/booking/catalog").then(r=>setLocations((r.data?.locations||[]).map((x:any)=>({id:String(x.id),name:String(x.name)})))).catch(()=>undefined)},[]);
 const load=useCallback(async()=>{setLoading(true);setError("");try{const r=await api.get("/transactions/booking-voice-stats",{params:{days,location_id:locationId||undefined}});setData(r.data)}catch(e:any){setError(e?.response?.data?.error||e?.message||"A Voice Booking statisztika nem tölthető be.")}finally{setLoading(false)}},[days,locationId]);
 useEffect(()=>{void load()},[load]);

 const totals=useMemo(()=>data?.summary||null,[data]);
 const aiCost=Number(data?.ai?.estimated_cost_usd||0).toLocaleString("hu-HU",{minimumFractionDigits:0,maximumFractionDigits:4});

 return <main className="voice-stats-page">
  <header className="voice-stats-hero">
   <div><span>FOGLALÁS 3.0 · VOICE BOOKING</span><h1>Voice Booking statisztika</h1><p>Hangalapú foglalási kérések felismerése, AI-használata, konverziója és szalononkénti teljesítménye.</p></div>
   <div className="voice-stats-actions">
    <label><CalendarRange/><select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 nap</option><option value={30}>30 nap</option><option value={90}>90 nap</option><option value={180}>180 nap</option><option value={365}>365 nap</option></select></label>
    <label><UsersRound/><select value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">Minden szalon</option>{locations.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <button onClick={()=>void load()} disabled={loading}><RefreshCw className={loading?"spin":""}/>Frissítés</button>
   </div>
  </header>

  {error&&<div className="voice-stats-error">{error}</div>}
  {!data&&loading?<div className="voice-stats-loading"><RefreshCw className="spin"/>Statisztika betöltése…</div>:data&&<>
   <section className="voice-kpis">
    <article><Mic2/><div><small>Hangértelmezések</small><strong>{num(totals?.voice_requests)}</strong><span>{num(totals?.recognized)} teljesen felismert</span></div></article>
    <article><CheckCircle2/><div><small>Felismerési arány</small><strong>{pct(totals?.recognition_rate)}</strong><span>átlag {num(totals?.avg_transcript_length)} karakter / kérés</span></div></article>
    <article><BrainCircuit/><div><small>AI-használat</small><strong>{pct(totals?.ai_share)}</strong><span>{num(totals?.ai_used)} AI-val értelmezett kérés</span></div></article>
    <article><TrendingUp/><div><small>Voice konverzió</small><strong>{pct(totals?.conversion_rate)}</strong><span>{num(totals?.voice_bookings)} hangos online foglalás</span></div></article>
    <article><Activity/><div><small>Voice részarány</small><strong>{pct(totals?.voice_booking_share)}</strong><span>{num(totals?.online_bookings)} normál online foglalás mellett</span></div></article>
    <article><Sparkles/><div><small>Voice várólista</small><strong>{num(totals?.voice_waitlist)}</strong><span>normál online: {num(totals?.online_waitlist)}</span></div></article>
   </section>

   <section className="voice-stats-grid">
    <article className="voice-panel voice-panel-wide"><header><div><span>NAPI TREND</span><h2>Hangalapú kérés → foglalás</h2></div></header><div className="voice-chart"><ResponsiveContainer width="100%" height={300}><LineChart data={data.daily}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)}/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Line type="monotone" dataKey="voice_requests" name="Hangértelmezés" stroke="#b69861" strokeWidth={2}/><Line type="monotone" dataKey="recognized" name="Felismert" stroke="#a44574" strokeWidth={2}/><Line type="monotone" dataKey="voice_bookings" name="Voice foglalás" stroke="#2d251f" strokeWidth={2}/></LineChart></ResponsiveContainer></div></article>
    <article className="voice-panel"><header><div><span>AI KÖLTSÉG ÉS TOKEN</span><h2>AI-használat</h2></div></header><div className="voice-ai-box"><BrainCircuit/><strong>{num(data.ai.calls)} hívás</strong><span>{num(data.ai.input_tokens)} input token</span><span>{num(data.ai.output_tokens)} output token</span><b>${aiCost} becsült költség</b></div><p className="voice-privacy">A statisztikai API nem adja vissza a vendégek felismert szövegét. Transcript tárolás: <b>{data.privacy.transcripts_stored?"bekapcsolva":"kikapcsolva"}</b>.</p></article>
   </section>

   <section className="voice-stats-grid">
    <article className="voice-panel voice-panel-wide"><header><div><span>SZALONOK</span><h2>Voice vs. normál online foglalás</h2></div></header><div className="voice-chart"><ResponsiveContainer width="100%" height={320}><BarChart data={data.locations}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={90}/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="voice_bookings" name="Voice foglalás" fill="#a44574"/><Bar dataKey="online_bookings" name="Normál online" fill="#b69861"/></BarChart></ResponsiveContainer></div></article>
    <article className="voice-panel"><header><div><span>SZÁNDÉKOK</span><h2>Mit mondanak a vendégek?</h2></div></header><div className="voice-list">{data.intents.map(x=><div key={x.intent}><span>{intentLabel(x.intent)}</span><b>{num(x.total)}</b><small>{num(x.recognized)} felismert · {num(x.ai_used)} AI</small></div>)}</div></article>
   </section>

   <section className="voice-stats-grid">
    <article className="voice-panel"><header><div><span>TOP SZOLGÁLTATÁSOK</span><h2>Leggyakrabban kért</h2></div></header><div className="voice-list">{data.top_services.length?data.top_services.map((x,i)=><div key={x.service_id}><span>{i+1}. {x.name}</span><b>{num(x.requests)}</b></div>):<div className="voice-empty">Még nincs elegendő adat.</div>}</div></article>
    <article className="voice-panel voice-panel-wide"><header><div><span>LEGUTÓBBI ESEMÉNYEK</span><h2>Voice felismerések</h2></div></header><div className="voice-table-wrap"><table><thead><tr><th>Időpont</th><th>Szalon</th><th>Szándék</th><th>Állapot</th><th>AI</th><th>Szolg.</th><th>Hiányzó adat</th></tr></thead><tbody>{data.recent.map(x=><tr key={x.id}><td>{new Date(x.created_at).toLocaleString("hu-HU",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}</td><td>{x.location_name||"—"}</td><td>{intentLabel(x.intent)}</td><td><span className={x.recognized?"ok":"warn"}>{x.recognized?"Felismert":"Hiányos"}</span></td><td>{x.ai_used?"Igen":"Nem"}</td><td>{num(x.service_count)}</td><td>{x.missing_fields?.length?x.missing_fields.map(missingLabel).join(", "):"—"}</td></tr>)}</tbody></table></div></article>
   </section>
  </>}
 </main>
}
