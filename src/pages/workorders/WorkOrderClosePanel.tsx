import React,{useState}from'react';
import{Archive,CheckCircle2,Download,FileCheck2,LockKeyhole,Mail,PackageCheck,ReceiptText,UsersRound}from'lucide-react';
import{authHeaders,withBase}from'../../utils/api';
import'./WorkOrderClosePanel.css';

type Props={ready:boolean;saving?:boolean;workOrderNumber?:string;financiallyClosed?:boolean;locked?:boolean;onFinalize:()=>void};
const items=[
 [ReceiptText,'Fizetés és pénzügyi zárás','A rögzített fizetések összege megegyezik a fizetendő összeggel.'],
 [PackageCheck,'Készletmozgás','A felhasznált termékek a szalon készletéből kerülnek levonásra.'],
 [UsersRound,'Hűség és jutalék','A bérlet, wallet, pont, kupon és utalvány végleges felhasználása, valamint a jutalékalap rögzítése megtörténik.'],
 [FileCheck2,'Pénzügyi bizonylati kapcsolat','A munkalaphoz belső számlatervezet és pénzügyi mozgások kapcsolódnak.'],
 [Archive,'Archiválás + PDF','A végleges állapot snapshotként archiválásra kerül, és ebből készül a lezárt digitális munkalap PDF.'],
 [Mail,'Automatikus e-mail','A lezárt PDF automatikusan továbbításra kerül a beállított vezetői címzetteknek.'],
 [LockKeyhole,'Zárolás','Lezárás után a munkalap és a kapcsolódó tranzakciók nem módosíthatók.']
]as const;

function workOrderIdFromPath(){
 try{const m=window.location.pathname.match(/\/workorders\/([^/?#]+)/);return m?.[1]?decodeURIComponent(m[1]):''}catch{return''}
}

async function errorMessage(res:Response){
 try{const d=await res.json();return String(d?.message||d?.error||`${res.status} ${res.statusText}`)}catch{return`${res.status} ${res.statusText}`}
}

export default function WorkOrderClosePanel({ready,saving,workOrderNumber,financiallyClosed=false,locked=false,onFinalize}:Props){
 const[documentBusy,setDocumentBusy]=useState(false);const[documentNotice,setDocumentNotice]=useState('');const[documentError,setDocumentError]=useState('');
 const state=locked?'Lezárt és archivált':ready?(financiallyClosed?'Pénzügyileg lezárt · archiválásra kész':'Lezárásra kész'):'Fizetés egyeztetése szükséges';
 const action=financiallyClosed?'Munkalap végleges lezárása':'Fizetés és munkalap végleges lezárása';
 const downloadPdf=async()=>{
  if(!locked)return setDocumentError('A PDF a munkalap végleges lezárása és archiválása után tölthető le.');
  const id=workOrderIdFromPath();if(!id)return setDocumentError('A munkalap azonosítója nem állapítható meg.');
  setDocumentBusy(true);setDocumentNotice('');setDocumentError('');
  try{
   const res=await fetch(withBase(`/api/transactions/workorder-finalization/workorders/${encodeURIComponent(id)}/pdf`),{credentials:'include',headers:authHeaders()});
   if(!res.ok)throw new Error(await errorMessage(res));
   const blob=await res.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${workOrderNumber||'lezart-munkalap'}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setDocumentNotice('A lezárt munkalap PDF elkészült és letöltésre került.');
  }catch(e:any){setDocumentError(e?.message||'A PDF letöltése nem sikerült.')}finally{setDocumentBusy(false)}
 };
 const resendEmail=async()=>{
  if(!locked)return setDocumentError('E-mailben csak a véglegesen lezárt és archivált munkalap küldhető el.');
  const id=workOrderIdFromPath();if(!id)return setDocumentError('A munkalap azonosítója nem állapítható meg.');
  setDocumentBusy(true);setDocumentNotice('');setDocumentError('');
  try{
   const res=await fetch(withBase(`/api/transactions/workorder-finalization/workorders/${encodeURIComponent(id)}/email`),{method:'POST',credentials:'include',headers:{...authHeaders(),'Content-Type':'application/json'},body:'{}'});
   if(!res.ok)throw new Error(await errorMessage(res));
   const data=await res.json();
   if(data?.mail?.sent)setDocumentNotice(`A lezárt munkalap PDF újraküldve: ${(data.mail.recipients||[]).join(', ')}`);
   else if(data?.mail?.logged)setDocumentError('A PDF elkészült, de az SMTP jelenleg ki van kapcsolva vagy nincs konfigurálva.');
   else setDocumentError(data?.mail?.error||'Az e-mail küldése nem sikerült.');
  }catch(e:any){setDocumentError(e?.message||'Az e-mail újraküldése nem sikerült.')}finally{setDocumentBusy(false)}
 };
 return <section className={`wo-close ${ready?'is-ready':'is-locked'}`}>
  <div className="wo-close__head"><div><span>7. LÉPÉS</span><h2><CheckCircle2/> Lezárás</h2><p>{locked?'A munkalap lezárt és archivált; a PDF letölthető vagy újraküldhető e-mailben.':'A végleges lezárás után a munkalap pénzügyi, készlet-, archiválási és dokumentumküldési folyamata befejeződik.'}</p></div><div className="wo-close__state"><b>{state}</b>{workOrderNumber&&<small>{workOrderNumber}</small>}</div></div>
  <div className="wo-close__grid">{items.map(([Icon,title,text])=><article key={title}><Icon/><div><b>{title}</b><p>{text}</p></div></article>)}</div>
  <div className="wo-close__warning"><LockKeyhole/><span><b>Végleges művelet.</b> Lezárás után a munkalap csak visszavonási/audit folyamattal korrigálható, közvetlen szerkesztéssel nem.</span></div>
  {!locked&&<div className="wo-close__warning"><FileCheck2/><span><b>PDF és e-mail:</b> a két dokumentumgomb már látható, de csak a sikeres végleges lezárás és archiválás után válik aktívvá.</span></div>}
  {documentNotice&&<div className="wo-close__warning"><CheckCircle2/><span>{documentNotice}</span></div>}
  {documentError&&<div className="wo-close__warning"><span><b>Dokumentumküldés:</b> {documentError}</span></div>}
  <div className="wo-close__actions">
   {!locked&&<button type="button" disabled={!ready||saving} onClick={onFinalize}>{saving?'Lezárás folyamatban…':action}</button>}
   <button type="button" disabled={!locked||documentBusy} title={locked?'Lezárt munkalap PDF letöltése':'Végleges lezárás után érhető el'} onClick={()=>void downloadPdf()}><Download size={16}/>{documentBusy&&locked?'Feldolgozás…':'PDF letöltése'}</button>
   <button type="button" disabled={!locked||documentBusy} title={locked?'Lezárt munkalap PDF újraküldése e-mailben':'Végleges lezárás után érhető el'} onClick={()=>void resendEmail()}><Mail size={16}/>PDF újraküldése e-mailben</button>
  </div>
 </section>
}
