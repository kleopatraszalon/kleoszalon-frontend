import React,{useState}from"react";
import{Save}from"lucide-react";
import api from"../api/api";
export default function AlertRuleEditor({rule,onSaved}:{rule:any;onSaved:()=>void}){
 const[value,setValue]=useState(Number(rule?.warning_value||0)),[error,setError]=useState("");
 async function save(){try{setError("");await api.put(`/transactions/alert-rules/rules/${rule.rule_key}`,{...rule,warning_value:value});onSaved()}catch(e:any){setError(e?.response?.data?.message||"A mentés sikertelen.")}}
 return <div className="notify-rule-editor"><label>Előriasztás<input type="number" min="0" value={value} onChange={e=>setValue(Number(e.target.value))}/></label><button onClick={()=>void save()}><Save/>Mentés</button>{error&&<small>{error}</small>}</div>;
}
