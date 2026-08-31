import React from 'react';
import {Link} from 'react-router-dom';

type Props={current:'core'|'signals'|'proposals'|'predictive'|'approval';en:boolean};
const steps=[
  {key:'core',to:'/admin/vir/intelligence',hu:'Üzleti állapot',en:'Business health'},
  {key:'signals',to:'/admin/vir/p16',hu:'Vezetői jelzések',en:'Executive signals'},
  {key:'proposals',to:'/admin/vir/p18',hu:'Döntési javaslatok',en:'Decision proposals'},
  {key:'predictive',to:'/admin/vir/p19',hu:'Predikció és optimalizálás',en:'Prediction & optimization'},
  {key:'approval',to:'/admin/vir/p17',hu:'Jóváhagyási központ',en:'Approval center'},
] as const;
export default function VirIntelligenceFlowNav({current,en}:Props){return <nav className="vir-intelligence-flow" aria-label={en?'VIR intelligence workflow':'VIR intelligencia munkafolyamat'}>{steps.map(s=><Link key={s.key} to={s.to} className={`vir-intelligence-flow-link ${current===s.key?'active':''}`}>{en?s.en:s.hu}</Link>)}</nav>;}