import React,{useMemo,useState}from'react';
import{BadgePercent,Building2,Check,CircleDollarSign,Percent,Sparkles,TrendingUp,Users}from'lucide-react';
import{ANNUAL_BILLING_DISCOUNT_MONTHS,BOOKING_COMMISSION_PERCENT,SAAS_ADDONS,SAAS_PLANS,SAAS_TARGETS}from'../saasCommercialModel';
import'./SaasCommercialModelPanel.css';

const money=(value:number)=>new Intl.NumberFormat('hu-HU',{style:'currency',currency:'HUF',maximumFractionDigits:0}).format(value);

export default function SaasCommercialModelPanel(){
 const[annual,setAnnual]=useState(false);
 const[customerCount,setCustomerCount]=useState(100);
 const averageMonthlyRevenue=useMemo(()=>{
  const mix=[{code:'start',share:.40},{code:'pro',share:.45},{code:'franchise',share:.12},{code:'enterprise',share:.03}];
  return Math.round(mix.reduce((sum,item)=>sum+(SAAS_PLANS.find(p=>p.code===item.code)?.monthlyPrice||0)*item.share,0));
 },[]);
 const mrr=averageMonthlyRevenue*customerCount;
 const arr=mrr*12;
 return <section className="saas-commercial-panel">
  <div className="saas-commercial-head">
   <div><span><Sparkles size={15}/>SAAS ÜZLETI MODELL</span><h2>Árazás és monetizáció</h2><p>A VIR Beauty Business OS kereskedelmi csomagjai, limitek és növekedési célok.</p></div>
   <div className="saas-billing-toggle"><button className={!annual?'is-active':''} onClick={()=>setAnnual(false)}>Havi</button><button className={annual?'is-active':''} onClick={()=>setAnnual(true)}>Éves · {ANNUAL_BILLING_DISCOUNT_MONTHS} hónap kedvezmény</button></div>
  </div>

  <div className="saas-commercial-principles">
   <div><Percent/><span><b>{BOOKING_COMMISSION_PERCENT}%</b><small>foglalási jutalék</small></span></div>
   <div><BadgePercent/><span><b>14 nap</b><small>START / PRO próbaidő</small></span></div>
   <div><CircleDollarSign/><span><b>Nettó HUF</b><small>listaár + ÁFA</small></span></div>
   <div><TrendingUp/><span><b>PRO</b><small>fő bevételi csomag</small></span></div>
  </div>

  <div className="saas-plan-grid">{SAAS_PLANS.map(plan=><article key={plan.code} className={plan.recommended?'is-recommended':''}>
   {plan.recommended&&<em>AJÁNLOTT</em>}
   <h3>{plan.name}</h3>
   <div className="saas-plan-price"><strong>{money(annual?plan.annualPrice:plan.monthlyPrice)}</strong><span>{annual?'/ év':'/ hó'}</span></div>
   <p className="saas-plan-onboarding">Bevezetés: {plan.onboardingFee==null?'egyedi':money(plan.onboardingFee)}{annual&&plan.code!=='franchise'&&plan.code!=='enterprise'?<b> · éves szerződésnél elengedhető</b>:null}</p>
   <div className="saas-plan-limits"><span><Building2 size={15}/>{plan.maxLocations==null?'Egyedi':`${plan.maxLocations} telephely`}</span><span><Users size={15}/>{plan.maxUsers==null?'Egyedi':`${plan.maxUsers} felhasználó`}</span></div>
   <ul>{plan.features.map(feature=><li key={feature}><Check size={14}/>{feature}</li>)}</ul>
  </article>)}</div>

  <div className="saas-commercial-bottom">
   <div className="saas-addon-card"><h3>Kiegészítő bevételek</h3>{SAAS_ADDONS.map(item=><div key={item.name}><span>{item.name}</span><b>{money(item.price)} {item.unit}</b></div>)}</div>
   <div className="saas-growth-card"><div className="saas-growth-head"><div><h3>Bevételi szimuláció</h3><p>40% START · 45% PRO · 12% FRANCHISE · 3% ENTERPRISE mix</p></div><label>Fizető tenant<input type="number" min={1} max={10000} value={customerCount} onChange={e=>setCustomerCount(Math.max(1,Number(e.target.value)||1))}/></label></div><div className="saas-growth-kpis"><span><small>Átlagos ARPA</small><b>{money(averageMonthlyRevenue)} / hó</b></span><span><small>MRR</small><b>{money(mrr)}</b></span><span><small>ARR</small><b>{money(arr)}</b></span></div></div>
  </div>

  <div className="saas-commercial-targets"><span><small>Trial → Paid</small><b>&gt; {SAAS_TARGETS.trialToPaid}%</b></span><span><small>Onboarding completion</small><b>&gt; {SAAS_TARGETS.onboardingCompletion}%</b></span><span><small>Havi logo churn</small><b>&lt; {SAAS_TARGETS.monthlyLogoChurnMax}%</b></span><span><small>Gross margin</small><b>&gt; {SAAS_TARGETS.grossMarginMin}%</b></span><span><small>CAC payback</small><b>&lt; {SAAS_TARGETS.cacPaybackMonthsMax} hó</b></span></div>
 </section>;
}
