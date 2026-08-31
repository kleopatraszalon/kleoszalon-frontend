import React,{useEffect,useMemo,useRef,useState} from 'react';
import {searchVirLookup,type VirLookupItem,type VirLookupKind} from '../api/virLookups';
import './VirSearchSelect.css';

type Props={kind:VirLookupKind;label:string;value:string;onChange:(id:string,item?:VirLookupItem)=>void;placeholder?:string;optional?:boolean;disabled?:boolean};

export default function VirSearchSelect({kind,label,value,onChange,placeholder,optional,disabled}:Props){
  const [query,setQuery]=useState('');
  const [items,setItems]=useState<VirLookupItem[]>([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [selected,setSelected]=useState<VirLookupItem|undefined>();
  const timer=useRef<number|undefined>();
  useEffect(()=>()=>{if(timer.current)window.clearTimeout(timer.current)},[]);
  useEffect(()=>{if(!value){setSelected(undefined);setQuery('')}},[value]);
  const secondary=useMemo(()=>selected?[selected.phone,selected.email,selected.status].filter(Boolean).join(' · '):'', [selected]);
  const load=(q:string)=>{if(timer.current)window.clearTimeout(timer.current);timer.current=window.setTimeout(async()=>{setLoading(true);try{setItems(await searchVirLookup(kind,q));setOpen(true)}finally{setLoading(false)}},180)};
  return <div className="vir-search-select">
    <label className="vir-search-label">{label}{optional&&<span> opcionális</span>}</label>
    <div className="vir-search-box">
      <input disabled={disabled} value={query} placeholder={placeholder||'Kezdj el gépelni...'} onFocus={()=>load(query)} onChange={e=>{const q=e.target.value;setQuery(q);setSelected(undefined);onChange('');load(q)}} aria-label={label}/>
      {loading&&<span className="vir-search-spinner">Keresés…</span>}
      {value&&<button type="button" className="vir-search-clear" onClick={()=>{onChange('');setSelected(undefined);setQuery('');setOpen(false)}} aria-label={`${label} törlése`}>×</button>}
      {open&&<div className="vir-search-menu">
        {items.length===0&&!loading?<div className="vir-search-empty">Nincs találat.</div>:items.map(item=><button type="button" key={item.id} className="vir-search-option" onMouseDown={e=>e.preventDefault()} onClick={()=>{setSelected(item);setQuery(item.label);onChange(item.id,item);setOpen(false)}}><strong>{item.label}</strong><small>{[item.phone,item.email,item.status].filter(Boolean).join(' · ')}</small></button>)}
      </div>}
    </div>
    {secondary&&<small className="vir-search-selected-meta">{secondary}</small>}
  </div>;
}
