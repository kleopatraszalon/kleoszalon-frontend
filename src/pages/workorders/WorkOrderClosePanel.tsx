import React from'react';
import{Archive,CheckCircle2,FileCheck2,LockKeyhole,PackageCheck,ReceiptText,UsersRound}from'lucide-react';
import'./WorkOrderClosePanel.css';

type Props={ready:boolean;saving?:boolean;workOrderNumber?:string;financiallyClosed?:boolean;locked?:boolean;onFinalize:()=>void};
const items=[
 [ReceiptText,'Fizetés és pénzügyi zárás','A rögzített fizetések összege megegyezik a fizetendő összeggel.'],
 [PackageCheck,'Készletmozgás','A felhasznált termékek a szalon készletéből kerülnek levonásra.'],
 [UsersRound,'Hűség és jutalék','A bérlet, wallet, pont, kupon és utalvány végleges felhasználása, valamint a jutalékalap rögzítése megtörténik.'],
 [FileCheck2,'Pénzügyi bizonylati kapcsolat','A munkalaphoz belső számlatervezet és pénzügyi mozgások kapcsolódnak.'],
 [Archive,'Archiválás','A végleges állapot snapshotként archiválásra kerül.'],
 [LockKeyhole,'Zárolás','Lezárás után a munkalap és a kapcsolódó tranzakciók nem módosíthatók.']
]as const;
export default function WorkOrderClosePanel({ready,saving,workOrderNumber,financiallyClosed=false,locked=false,onFinalize}:Props){
 const state=locked?'Lezárt és archivált':ready?(financiallyClosed?'Pénzügyileg lezárt · archiválásra kész':'Lezárásra kész'):'Fizetés egyeztetése szükséges';
 const action=financiallyClosed?'Munkalap végleges lezárása':'Fizetés és munkalap végleges lezárása';
 return <section className={`wo-close ${ready?'is-ready':'is-locked'}`}>
  <div className="wo-close__head"><div><span>7. LÉPÉS</span><h2><CheckCircle2/> Lezárás</h2><p>{locked?'A munkalap lezárt és archivált; közvetlenül már nem módosítható.':'A végleges lezárás után a munkalap pénzügyi, készlet- és auditfolyamata befejeződik.'}</p></div><div className="wo-close__state"><b>{state}</b>{workOrderNumber&&<small>{workOrderNumber}</small>}</div></div>
  <div className="wo-close__grid">{items.map(([Icon,title,text])=><article key={title}><Icon/><div><b>{title}</b><p>{text}</p></div></article>)}</div>
  <div className="wo-close__warning"><LockKeyhole/><span><b>Végleges művelet.</b> Lezárás után a munkalap csak visszavonási/audit folyamattal korrigálható, közvetlen szerkesztéssel nem.</span></div>
  <div className="wo-close__actions"><button type="button" disabled={locked||!ready||saving} onClick={onFinalize}>{saving?'Lezárás folyamatban…':locked?'Munkalap lezárva':action}</button></div>
 </section>
}
