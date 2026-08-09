import React,{useMemo}from'react';
import{CreditCard,Landmark,Plus,Trash2,WalletCards}from'lucide-react';

export type PaymentMethod='cash'|'card'|'transfer'|'other';
export type PaymentDraft={id:number;payment_method:PaymentMethod;amount:string;note:string;destination?:string};

type Props={
  grossTotal:number;
  payableTotal:number;
  loyaltyCredit:number;
  payments:PaymentDraft[];
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

export default function WorkOrderPaymentPanel({grossTotal,payableTotal,loyaltyCredit,payments,disabled,onAdd,onChange,onRemove}:Props){
  const paid=useMemo(()=>payments.reduce((sum,p)=>sum+Math.max(0,Number(p.amount||0)),0),[payments]);
  const difference=Math.round((paid-payableTotal)*100)/100;
  const ready=!disabled&&Math.abs(difference)<.01;
  return <section className={`wo-payment ${disabled?'is-disabled':''}`}>
    <div className="wo-payment__head">
      <div><span>6. LÉPÉS</span><h2><CreditCard/> Fizetés</h2><p>A munkalap több fizetési módra bontható. A Lezárás csak 0 Ft eltérésnél engedélyezett.</p></div>
      <div className={`wo-payment__state ${ready?'is-ready':''}`}><b>{ready?'Fizetés rendben':'Egyeztetés szükséges'}</b><small>Eltérés: {money(difference)}</small></div>
    </div>
    <div className="wo-payment__totals">
      <div><small>Bruttó munkalap</small><b>{money(grossTotal)}</b></div>
      <div><small>Kedvezmény / hűség / bérlet</small><b>-{money(loyaltyCredit)}</b></div>
      <div className="is-primary"><small>Fizetendő</small><b>{money(payableTotal)}</b></div>
      <div><small>Rögzített fizetés</small><b>{money(paid)}</b></div>
      <div className={Math.abs(difference)<.01?'is-ok':'is-error'}><small>Eltérés</small><b>{money(difference)}</b></div>
    </div>
    <div className="wo-payment__toolbar"><div><WalletCards/><span>Kevert fizetés</span></div><button type="button" disabled={disabled} onClick={onAdd}><Plus/> Fizetési sor</button></div>
    <div className="wo-payment__rows">
      {payments.map(p=>{
        const method=p.payment_method;
        const options=destinations[method];
        const destination=p.destination||options[0];
        return <div className="wo-payment__row" key={p.id}>
          <label>Fizetési mód<select disabled={disabled} value={method} onChange={e=>{const m=e.target.value as PaymentMethod;onChange(p.id,'payment_method',m);onChange(p.id,'destination',destinations[m][0])}}>{Object.entries(methodLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>Pénztár / terminál<select disabled={disabled} value={destination} onChange={e=>onChange(p.id,'destination',e.target.value)}>{options.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
          <label>Összeg<input disabled={disabled} type="number" min="0" step="1" value={p.amount} onChange={e=>onChange(p.id,'amount',e.target.value)} placeholder="0"/></label>
          <label>Megjegyzés<input disabled={disabled} value={p.note} onChange={e=>onChange(p.id,'note',e.target.value)} placeholder="Opcionális"/></label>
          <button className="wo-payment__delete" type="button" disabled={disabled} onClick={()=>onRemove(p.id)} title="Fizetési sor törlése"><Trash2/></button>
        </div>})}
    </div>
    <div className="wo-payment__foot"><Landmark/><span>A pénztár/terminál megnevezése a fizetési sorral együtt kerül eltárolásra. Több fizetési mód egyszerre használható.</span></div>
  </section>
}
