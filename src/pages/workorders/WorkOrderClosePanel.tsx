import React from'react';
import{Archive,CheckCircle2,FileCheck2,LockKeyhole,PackageCheck,ReceiptText,UsersRound}from'lucide-react';
import'./WorkOrderClosePanel.css';

type Props={ready:boolean;saving?:boolean;workOrderNumber?:string;onFinalize:()=>void};
const items=[
 [ReceiptText,'Fizetés és pénzügyi zárás','A rögzített fizetések összege megegyezik a fizetendő összeggel.'],
 [PackageCheck,'Készletmozgás','A felhasznált termékek a szalon készletéből kerülnek levonásra.'],
 [UsersRound,'Hűség és jutalék','A bérlet, wallet, pont, kupon és utalvány végleges felhasználása, valamint a jutalékalap rögzítése megtörténik.'],
 [FileCheck2,'Pénzügyi bizonylati kapcsolat','A munkalaphoz belső számlatervezet és pénzügyi mozgások kapcsolódnak.'],
 [Archive,'Archiválás','A végleges állapot snapshotként archiválásra kerül.'],
 [LockKeyhole,'Zárolás','Lezárás után a munkalap és a kapcsolódó tranzakciók nem módosíthatók.']
]as const;
export default function WorkOrderClosePanel({ready,saving,workOrderNumber,onFinalize}:Props){return <section className={`wo-close ${ready?'is-ready':'is-locked'}`}>
 <div className="wo-close__head"><div><span>7. LÉPÉS</span><h2><CheckCircle2/> Lezárás</h2><p>A végleges lezárás után a munkalap pénzügyi, készlet- és auditfolyamata befejeződik.</p></div><div className="wo-close__state"><b>{ready?'Lezárásra kész':'Fizetés egyeztetése szükséges'}</b>{workOrderNumber&&<small>{workOrderNumber}</small>}</div></div>
 <div className="wo-close__grid">{items.map(([Icon,title,text])=><article key={title}><Icon/><div><b>{title}</b><p>{text}</p></div></article>)}</div>
 <div className="wo-close__warning"><LockKeyhole/><span><b>Végleges művelet.</b> Lezárás után a munkalap csak visszavonási/audit folyamattal korrigálható, közvetlen szerkesztéssel nem.</span></div>
 <div className="wo-close__actions"><button type="button" disabled={!ready||saving} onClick={onFinalize}>{saving?'Lezárás folyamatban…':'Fizetés és munkalap végleges lezárása'}</button></div>
 </section>}
