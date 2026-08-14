import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { useLanguage } from "../i18n/LanguageProvider";
import withBase from "../utils/apiBase";

type UUID = string;
interface ServiceTypeItem { id: UUID | string; name: string; }
interface ServiceOption { id: UUID | string; name: string; }
export type Service = {
  id: UUID | string; name: string; code?: string | null; short_name?: string | null;
  description_short?: string | null; description_long?: string | null; service_type_id?: UUID | null;
  parent_service_id?: UUID | null; base_price?: number | null; list_price?: number | null; currency?: string | null;
  duration_minutes?: number | null; wait_duration_min?: number | null; promo_price?: number | null;
  promo_valid_from?: string | null; promo_valid_to?: string | null; promo_label?: string | null;
  online_bookable?: boolean | null; is_active?: boolean | null; is_combo?: boolean | null;
};
interface ServiceNewModalProps { isOpen: boolean; onRequestClose: () => void; onServiceCreated?: (srv: Service | null) => void; }

const getToken=()=>localStorage.getItem("kleo_token")||localStorage.getItem("token")||"";
const authHeaders=():Record<string,string>=>{const token=getToken();return token?{Authorization:`Bearer ${token}`}:{}};
const safeParse=<T,>(txt:string,fallback:T):T=>{try{return JSON.parse(txt) as T}catch{return fallback}};
async function parseJson<T>(res:Response,fallback:T):Promise<T>{const txt=await res.text();return txt?safeParse<T>(txt,fallback):fallback;}

const ServiceNewModal:React.FC<ServiceNewModalProps>=({isOpen,onRequestClose,onServiceCreated})=>{
  const{language,t}=useLanguage();const text=(hu:string,en:string)=>language==="en"?en:hu;
  const[name,setName]=useState("");const[code,setCode]=useState("");const[shortName,setShortName]=useState("");
  const[serviceTypes,setServiceTypes]=useState<ServiceTypeItem[]>([]);const[servicesForParent,setServicesForParent]=useState<ServiceOption[]>([]);
  const[serviceTypeId,setServiceTypeId]=useState("");const[parentServiceId,setParentServiceId]=useState("");
  const[basePrice,setBasePrice]=useState("");const[listPrice,setListPrice]=useState("");const[currency,setCurrency]=useState("HUF");
  const[durationMin,setDurationMin]=useState("");const[waitDurationMin,setWaitDurationMin]=useState("");
  const[descShort,setDescShort]=useState("");const[descLong,setDescLong]=useState("");
  const[promoPrice,setPromoPrice]=useState("");const[promoFrom,setPromoFrom]=useState("");const[promoTo,setPromoTo]=useState("");const[promoLabel,setPromoLabel]=useState("");
  const[active,setActive]=useState(true);const[onlineBookable,setOnlineBookable]=useState(true);const[isCombo,setIsCombo]=useState(false);
  const[saving,setSaving]=useState(false);const[errorMsg,setErrorMsg]=useState("");const[successMsg,setSuccessMsg]=useState("");

  useEffect(()=>{if(!isOpen)return;const run=async()=>{try{const headers=authHeaders();const[typesRes,srvRes]=await Promise.all([fetch(withBase("service-types"),{headers}),fetch(withBase("services?include_inactive=1"),{headers})]);if(typesRes.ok)setServiceTypes((await parseJson<ServiceTypeItem[]>(typesRes,[]))||[]);if(srvRes.ok){const all=(await parseJson<ServiceOption[]>(srvRes,[]))||[];setServicesForParent(all.map(s=>({id:s.id,name:(s as any).name||""})));}}catch{/* optional selector data */}};void run();},[isOpen]);

  const resetForm=()=>{setName("");setCode("");setShortName("");setServiceTypeId("");setParentServiceId("");setBasePrice("");setListPrice("");setCurrency("HUF");setDurationMin("");setWaitDurationMin("");setDescShort("");setDescLong("");setPromoPrice("");setPromoFrom("");setPromoTo("");setPromoLabel("");setActive(true);setOnlineBookable(true);setIsCombo(false);setErrorMsg("");setSuccessMsg("");};
  const close=()=>{resetForm();onRequestClose();};

  const handleSave=async()=>{setErrorMsg("");setSuccessMsg("");if(!name.trim()){setErrorMsg(text("A szolgáltatás neve kötelező.","Service name is required."));return}if(!durationMin.trim()){setErrorMsg(text("Az időtartam (perc) kötelező.","Duration in minutes is required."));return}try{setSaving(true);const payload:any={name:name.trim(),code:code.trim()||null,short_name:shortName.trim()||null,service_type_id:serviceTypeId||null,parent_service_id:parentServiceId||null,base_price:basePrice?Number(basePrice):null,list_price:listPrice?Number(listPrice):basePrice?Number(basePrice):null,currency:currency||"HUF",duration_minutes:Number(durationMin),wait_duration_min:waitDurationMin?Number(waitDurationMin):null,description_short:descShort.trim()||null,description_long:descLong.trim()||null,promo_price:promoPrice?Number(promoPrice):null,promo_valid_from:promoFrom||null,promo_valid_to:promoTo||null,promo_label:promoLabel.trim()||null,is_active:active,online_bookable:onlineBookable,is_combo:isCombo};const res=await fetch(withBase("services"),{method:"POST",headers:{"Content-Type":"application/json",...authHeaders()},body:JSON.stringify(payload)});const data=await parseJson<Service|any>(res,{} as any);if(!res.ok)throw new Error(data?.error||text("Nem sikerült létrehozni az új szolgáltatást.","The new service could not be created."));setSuccessMsg(text("Új szolgáltatás elmentve.","New service saved."));onServiceCreated?.(data as Service);resetForm();}catch(e:any){setErrorMsg(e?.message||text("Hiba történt a mentés közben.","An error occurred while saving."));onServiceCreated?.(null)}finally{setSaving(false)}};

  if(!isOpen)return null;
  return <Modal isOpen={isOpen} onRequestClose={close} contentLabel={text("Új szolgáltatás felvétele","Add new service")} style={{overlay:{backgroundColor:"rgba(18,12,8,0.65)",backdropFilter:"blur(4px)",zIndex:9999},content:{inset:"40px auto auto",maxWidth:"1200px",width:"calc(100% - 80px)",margin:"0 auto",border:"none",background:"transparent",padding:0,overflow:"visible"}}}>
    <div className="bg-white/98 text-[#120c08] border border-[#d5c4a4] rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)] overflow-visible">
      <div className="flex items-center justify-end gap-2 p-3 border-b border-[#e3d8c3] bg-gradient-to-r from-[#fffaf5] via-[#f9f0e4] to-[#fffaf5]"><button onClick={close} className="px-3 py-2 text-xs font-medium rounded-full border border-[#d5c4a4] text-[#5d5a55] bg-white/80 hover:bg-white">{t("common.close")}</button><button onClick={handleSave} disabled={saving} className={`px-3 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#b69861] to-[#ec008c] text-white shadow-md hover:shadow-lg hover:brightness-105 ${saving?"opacity-60 cursor-not-allowed":""}`}>{saving?t("common.saving"):t("common.save")}</button></div>
      <div className="p-4"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-300 grid place-items-center overflow-hidden"><span className="text-gray-400 text-xs leading-tight text-center">{text("Új","New")}<br/>{text("Szolgáltatás","Service")}</span></div><div className="flex-1"><div className="text-lg font-semibold">{text("Új szolgáltatás felvétele","Add new service")}</div><div className="text-xs text-gray-500">{text("Alapadatok, árazás, akció, hierarchia és foglalhatóság beállítása.","Configure basic data, pricing, promotion, hierarchy and booking availability.")}</div></div></div></div>
      <div className="px-4 pb-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={text("Alapadatok","Basic data")}>
          <Field label={text("Név *","Name *")}><input className={inputClass} value={name} onChange={e=>setName(e.target.value)} placeholder={text("pl. Géllakk kézre","e.g. Gel polish – hands")}/></Field>
          <Field label={text("Kód","Code")}><input className={inputClass} value={code} onChange={e=>setCode(e.target.value)} placeholder="GLK-KEZ-01"/></Field>
          <Field label={text("Rövid név (opcionális)","Short name (optional)")}><input className={inputClass} value={shortName} onChange={e=>setShortName(e.target.value)} placeholder={text("pl. Géllakk kéz","e.g. Gel polish hands")}/></Field>
          <Field label={text("Szolgáltatás típus","Service type")}><select className={inputClass} value={serviceTypeId} onChange={e=>setServiceTypeId(e.target.value)}><option value="">{text("— Nincs típus hozzárendelve —","— No type assigned —")}</option>{serviceTypes.map(item=><option key={String(item.id)} value={String(item.id)}>{item.name}</option>)}</select></Field>
          <Field label={text("Főszolgáltatás","Parent service")}><select className={inputClass} value={parentServiceId} onChange={e=>setParentServiceId(e.target.value)}><option value="">{text("— Ez egy főszolgáltatás —","— This is a top-level service —")}</option>{servicesForParent.map(item=><option key={String(item.id)} value={String(item.id)}>{item.name}</option>)}</select></Field>
        </Section>
        <Section title={text("Árazás és idő","Pricing & duration")}>
          <div className="grid grid-cols-2 gap-2"><Field label={text("Alap ár (Ft)","Base price (HUF)")}><input type="number" min={0} className={inputClass} value={basePrice} onChange={e=>setBasePrice(e.target.value)}/></Field><Field label={text("Listaár (Ft)","List price (HUF)")}><input type="number" min={0} className={inputClass} value={listPrice} onChange={e=>setListPrice(e.target.value)} placeholder={text("ha üres, az alap ár kerül listaárként","uses base price when empty")}/></Field></div>
          <div className="grid grid-cols-2 gap-2"><Field label={text("Pénznem","Currency")}><input className={inputClass} value={currency} onChange={e=>setCurrency(e.target.value)}/></Field><Field label={text("Időtartam (perc) *","Duration (minutes) *")}><input type="number" min={1} className={inputClass} value={durationMin} onChange={e=>setDurationMin(e.target.value)}/></Field></div>
          <Field label={text("Hatóidő / várakozás (perc)","Processing / wait time (minutes)")}><input type="number" min={0} className={inputClass} value={waitDurationMin} onChange={e=>setWaitDurationMin(e.target.value)}/></Field>
          <div className="text-sm font-semibold mt-3">{text("Akció (opcionális)","Promotion (optional)")}</div>
          <div className="grid grid-cols-2 gap-2"><Field label={text("Akciós ár (Ft)","Promotional price (HUF)")}><input type="number" min={0} className={inputClass} value={promoPrice} onChange={e=>setPromoPrice(e.target.value)}/></Field><Field label={text("Akció neve","Promotion name")}><input className={inputClass} value={promoLabel} onChange={e=>setPromoLabel(e.target.value)} placeholder={text("pl. Tavaszi akció","e.g. Spring promotion")}/></Field></div>
          <div className="grid grid-cols-2 gap-2"><Field label={text("Akció kezdete (YYYY-MM-DD)","Promotion starts (YYYY-MM-DD)")}><input className={inputClass} value={promoFrom} onChange={e=>setPromoFrom(e.target.value)}/></Field><Field label={text("Akció vége (YYYY-MM-DD)","Promotion ends (YYYY-MM-DD)")}><input className={inputClass} value={promoTo} onChange={e=>setPromoTo(e.target.value)}/></Field></div>
          <div className="text-sm font-semibold mt-3">{text("Egyéb beállítások","Other settings")}</div>
          <Check checked={active} onChange={setActive} label={t("common.active")}/><Check checked={onlineBookable} onChange={setOnlineBookable} label={text("Foglalható online","Available for online booking")}/><Check checked={isCombo} onChange={setIsCombo} label={text("Kombinált (összetett) szolgáltatás","Combined service")}/>
        </Section>
      </div>
      <Section title={text("Leírások","Descriptions")} className="mt-4"><Field label={text("Rövid leírás","Short description")}><input className={inputClass} value={descShort} onChange={e=>setDescShort(e.target.value)} placeholder={text("pl. 1 színnel, erős fényű géllakk.","e.g. High-gloss gel polish in one color.")}/></Field><Field label={text("Részletes leírás","Detailed description")}><textarea className={inputClass} rows={3} value={descLong} onChange={e=>setDescLong(e.target.value)}/></Field></Section>
      {errorMsg&&<div className="mt-3 text-xs text-red-600">{errorMsg}</div>}{successMsg&&<div className="mt-3 text-xs text-emerald-600">{successMsg}</div>}</div>
    </div>
  </Modal>;
};

function Section({title,children,className=""}:{title:string;children:React.ReactNode;className?:string}){return <section className={`bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2 ${className}`}><div className="text-sm font-semibold">{title}</div>{children}</section>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="text-xs block"><span className="text-gray-500 block mb-1">{label}</span>{children}</label>}
function Check({checked,onChange,label}:{checked:boolean;onChange:(value:boolean)=>void;label:string}){return <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>{label}</label>}
const inputClass="w-full border border-gray-300 rounded-md px-3 py-2 text-sm";
export default ServiceNewModal;
