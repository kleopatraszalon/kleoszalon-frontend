import React,{useMemo,useState}from'react';
import{CreditCard,Landmark,Plus,Trash2,WalletCards}from'lucide-react';
import{dispatchTerminalPayment,terminalApprovalNote}from'../../utils/paymentTerminal';
import'./WorkOrderPaymentPanel.css';

export type PaymentMethod='cash'|'card'|'transfer'|'other';
export type PaymentDraft={id:number;payment_method:PaymentMethod;amount:string;note:string;destination?:string};

type Props={
  grossTotal:number;
  payableTotal:number;
  loyaltyCredit:number;
  payments:PaymentDraft[];
  alreadyPaid?:number;
  loyaltyTender?:number;
  disabled?:boolean;
  onAdd:()=>void;
  onChange:(id:number,key:keyof PaymentDraft,value:string)=>void;
  onRemove:(id:number)=>void;
};

const money=(v:number)=>`${Number(v||0).toLocaleString('hu-HU',{maximumFractionDigits:0})} Ft`;
const destinations:Record<PaymentMethod,string[]>={
  cash:['Szaloni készpénzpénztár'],
  card:['Bankkártya terminál'],
  transfer:['Banki átutalás'],
  other:['Egyéb pénztár']
};
const methodLabel:Record<PaymentMethod,string>={cash:'Készpénz',card:'Bankkártya',transfer:'Átutalás',other:'Egyéb'};

export default function WorkOrderPaymentPanel({grossTotal,payableTotal,loyaltyCredit,payments,alreadyPaid=0,loyaltyTender=0,disabled,onAdd,onChange,onRemove}:Props){
  const[terminalBusy,setTerminalBusy]=useState<number|null>(null);
  const[terminalMessage,setTerminalMessage]=useState('');
  const draftPaid=useMemo(()=>payments.reduce((sum,p)=>sum+Math.max(0,Number(p.amount||0)),0),[payments]);
  const paid=Number(alreadyPaid||0)+Number(loyaltyTender||0)+draftPaid;
  const difference=Math.round((paid-payableTotal)*100)/100;
  const ready=!disabled&&Math.abs(difference)<.01;

  async function sendToTerminal(p:PaymentDraft){
    const match=window.location.pathname.match(/\/workorders\/([^/?#]+)/i);
    const workOrderId=match?.[1];
    if(!workOrderId){setTerminalMessage('A munkalap azonosítója nem olvasható ki az oldalból.');return;}
    setTerminalBusy(p.id);setTerminalMessage('Összeg küldése a terminálra…');
    try{
      const requested=Number(p.amount||0);
      const result=await dispatchTerminalPayment({source_type:'WORK_ORDER',source_id:workOrderId,...(requested>0?{requested_amount:requested}:{})});
      if(String(result.transaction.status).toUpperCase()!=='APPROVED')throw new Error(`A terminál nem hagyta jóvá a fizetést (${result.transaction.status}).`);
      onChange(p.id,'amount',String(Number(result.transaction.amount||0)));
      const audit=terminalApprovalNote(result.transaction,result.simulator);
      onChange(p.id,'note',[p.note,audit].filter(Boolean).join(' | '));
      onChange(p.id,'destination',result.terminal?.name||'Bankkártya terminál');
      setTerminalMessage(result.simulator?`Teszt jóváhagyás: ${money(Number(result.transaction.amount||0))}. Valódi terhelés nem történt.`:`Kártyás fizetés jóváhagyva: ${money(Number(result.transaction.amount||0))}.`);
    }catch(error:any){setTerminalMessage(error?.message||'A terminálművelet nem sikerült.');}
    finally{setTerminalBusy(null);}
  }

  return <section className={`wo-payment ${disabled?'is-disabled':''}`}>
    <div className="wo-payment__head">
      <div><span>6. LÉPÉS</span><h2><CreditCard/> Fizetés</h2><p>A munkalap több fizetési módra bontható. Meglévő részfizetés, wallet vagy utalvány esetén ezek is beleszámítanak az egyeztetésbe.</p></div>
      <div className={`wo-payment__state ${ready?'is-ready':''}`}><b>{ready?'Fizetés rendben':'Egyeztetés szükséges'}</b><small>Eltérés: {money(difference)}</small></div>
    </div>
    <div className="wo-payment__totals">
      <div><small>Bruttó munkalap</small><b>{money(grossTotal)}</b></div>
      <div><small>Kedvezmény / hűség / bérlet</small><b>-{money(loyaltyCredit)}</b></div>
      <div className="is-primary"><small>Fizetendő</small><b>{money(payableTotal)}</b></div>
      <div><small>Korábban rögzített</small><b>{money(alreadyPaid)}</b></div>
      <div><small>Wallet / utalvány</small><b>{money(loyaltyTender)}</b></div>
      <div><small>Új fizetési sorok</small><b>{money(draftPaid)}</b></div>
      <div className={Math.abs(difference)<.01?'is-ok':'is-error'}><small>Eltérés</small><b>{money(difference)}</b></div>
    </div>
    <div className="wo-payment__toolbar"><div><WalletCards/><span>Kevert fizetés</span></div><button type="button" disabled={disabled} onClick={onAdd}><Plus/> Fizetési sor</button></div>
    {terminalMessage&&<div style={{margin:'0 0 12px',padding:'10px 12px',border:'1px solid #d9d9df',borderRadius:10,background:'#fafafa',fontSize:13}}>{terminalMessage}</div>}
    <div className="wo-payment__rows">
      {payments.map(p=>{
        const method=p.payment_method;
        const options=destinations[method];
        const destination=p.destination||options[0];
        return <div className="wo-payment__row" key={p.id}>
          <label>Fizetési mód<select disabled={disabled||terminalBusy===p.id} value={method} onChange={e=>{const m=e.target.value as PaymentMethod;onChange(p.id,'payment_method',m);onChange(p.id,'destination',destinations[m][0])}}>{Object.entries(methodLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>Pénztár / terminál<select disabled={disabled||terminalBusy===p.id} value={destination} onChange={e=>onChange(p.id,'destination',e.target.value)}>{options.includes(destination)?options.map(x=><option key={x} value={x}>{x}</option>):[destination,...options].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
          <label>Összeg<input disabled={disabled||terminalBusy===p.id} type="number" min="0" step="1" value={p.amount} onChange={e=>onChange(p.id,'amount',e.target.value)} placeholder="0"/></label>
          <label>Megjegyzés<input disabled={disabled||terminalBusy===p.id} value={p.note} onChange={e=>onChange(p.id,'note',e.target.value)} placeholder="Opcionális"/></label>
          {method==='card'&&<button type="button" disabled={disabled||terminalBusy!==null} onClick={()=>sendToTerminal(p)} style={{minWidth:150,height:42,border:0,borderRadius:10,fontWeight:800,cursor:'pointer'}}>{terminalBusy===p.id?'Terminál…':'Terminálra küldés'}</button>}
          <button className="wo-payment__delete" type="button" disabled={disabled||terminalBusy===p.id} onClick={()=>onRemove(p.id)} title="Fizetési sor törlése"><Trash2/></button>
        </div>})}
    </div>
    <div className="wo-payment__foot"><Landmark/><span>A bankkártyás összeg a szerveren kerül újraszámításra, a terminál-azonosító pedig a fizetési sor megjegyzésébe kerül. Több fizetési mód egyszerre használható.</span></div>
  </section>
}