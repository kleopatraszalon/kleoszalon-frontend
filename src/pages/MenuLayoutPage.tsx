import React,{useCallback,useEffect,useMemo,useState}from"react";
import{AlertTriangle,CheckCircle2,GripVertical,RefreshCw,RotateCcw,Save,Undo2}from"lucide-react";
import api from"../api/api";
import{canonicalMenuLabel}from"../utils/menuLabels";
import"./MenuLayoutPage.css";

type MenuNode={id:number;code?:string|null;name:string;route?:string|null;order_index?:number|null;parent_id?:number|null;submenus?:MenuNode[]};
type DragInfo={id:number;parentId:number|null};

const MENU_CACHE_KEYS=["kleo.menu.cache.v16","kleo.menu.cache.v17"];
const ROOT_LABELS:Record<string,string>={
 dashboard:"Irányítópult",
 appointments:"Időpontok és beosztás",
 customers:"Ügyfelek és CRM",
 loyalty:"Törzsvásárlói program",
 team:"Munkatársak és HR",
 finance:"Pénzügyek",
 inventory:"Raktár és készlet",
 procurement:"Beszerzés",
 analytics:"Vezetői riportok",
 locations:"Telephelyek",
 marketing:"Marketing",
 online:"Online foglalás és alkalmazás",
 commerce:"Értékesítés és webshop",
 settings:"Beállítások és adminisztráció",
};
const displayName=(item:MenuNode)=>item.code&&ROOT_LABELS[item.code]?ROOT_LABELS[item.code]:canonicalMenuLabel(item.name);
const copyTree=(roots:MenuNode[])=>roots.map(r=>({...r,submenus:(r.submenus||[]).map(c=>({...c,submenus:[]}))}));
const clearMenuCache=()=>{try{MENU_CACHE_KEYS.forEach(key=>localStorage.removeItem(key))}catch{}};

function removeItem(roots:MenuNode[],info:DragInfo):{roots:MenuNode[];item:MenuNode|null}{
 const next=copyTree(roots);
 if(info.parentId===null){const i=next.findIndex(x=>x.id===info.id);if(i<0)return{roots:next,item:null};const[item]=next.splice(i,1);return{roots:next,item}}
 const parent=next.find(x=>x.id===info.parentId);if(!parent)return{roots:next,item:null};const children=parent.submenus||[];const i=children.findIndex(x=>x.id===info.id);if(i<0)return{roots:next,item:null};const[item]=children.splice(i,1);parent.submenus=children;return{roots:next,item};
}

export default function MenuLayoutPage(){
 const[roots,setRoots]=useState<MenuNode[]>([]),[original,setOriginal]=useState<MenuNode[]>([]);
 const[drag,setDrag]=useState<DragInfo|null>(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const[dirty,setDirty]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");

 const load=useCallback(async()=>{setLoading(true);setError("");try{const r=await api.get("/menus");const rows=Array.isArray(r.data)?r.data:[];const tree=copyTree(rows);setRoots(tree);setOriginal(copyTree(tree));setDirty(false)}catch(e:any){setError(e?.response?.data?.message||e?.response?.data?.error||e?.message||"A menü betöltése nem sikerült.")}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);

 const total=useMemo(()=>roots.reduce((n,r)=>n+1+(r.submenus?.length||0),0),[roots]);
 const mark=(next:MenuNode[])=>{setRoots(next);setDirty(true);setNotice("")};

 function dropRoot(index:number){
  if(!drag)return;const removed=removeItem(roots,drag);if(!removed.item)return;
  const item={...removed.item,parent_id:null};let pos=index;
  if(drag.parentId===null){const old=roots.findIndex(x=>x.id===drag.id);if(old>=0&&old<index)pos--}
  removed.roots.splice(Math.max(0,Math.min(pos,removed.roots.length)),0,item);mark(removed.roots);setDrag(null);
 }
 function dropInto(parentId:number,index?:number){
  if(!drag||drag.id===parentId)return;const removed=removeItem(roots,drag);if(!removed.item)return;
  if((removed.item.submenus||[]).length){setError("Almenükkel rendelkező főmenü nem helyezhető másik főmenü alá. Előbb helyezze át az almenüit.");setDrag(null);return}
  const parent=removed.roots.find(x=>x.id===parentId);if(!parent){setDrag(null);return}
  const children=parent.submenus||[];const oldParent=drag.parentId===parentId,oldIndex=oldParent?(roots.find(x=>x.id===parentId)?.submenus||[]).findIndex(x=>x.id===drag.id):-1;
  let pos=index??children.length;if(oldParent&&oldIndex>=0&&oldIndex<pos)pos--;
  children.splice(Math.max(0,Math.min(pos,children.length)),0,{...removed.item,parent_id:parentId,submenus:[]});parent.submenus=children;mark(removed.roots);setDrag(null);
 }

 async function save(){
  if(!dirty)return;setSaving(true);setError("");setNotice("");
  try{
   const items=roots.flatMap((root,ri)=>[
    {id:root.id,parent_id:null,order_index:(ri+1)*10},
    ...(root.submenus||[]).map((child,ci)=>({id:child.id,parent_id:root.id,order_index:(ci+1)*10})),
   ]);
   await api.put("/menus/layout",{items});
   setOriginal(copyTree(roots));setDirty(false);setNotice("A menü sorrendje és az áthelyezések elmentve. Az oldalsáv frissül.");
   clearMenuCache();
   window.setTimeout(()=>window.location.reload(),350);
  }catch(e:any){setError(e?.response?.data?.message||e?.response?.data?.error||e?.message||"A menürendezést nem sikerült menteni.")}finally{setSaving(false)}
 }
 async function resetDefault(){
  if(!window.confirm("Visszaállítsuk a rendszer alapértelmezett menüelrendezését?"))return;
  setSaving(true);setError("");try{await api.delete("/menus/layout");clearMenuCache();await load();setNotice("Az alapértelmezett menüelrendezés visszaállítva.")}catch(e:any){setError(e?.response?.data?.message||e?.message||"A visszaállítás nem sikerült.")}finally{setSaving(false)}
 }

 return <main className="menu-layout-page">
  <header className="menu-layout-head"><div><small>KLEOPÁTRA VIR · ADMINISZTRÁCIÓ</small><h1>Menürendezés</h1><p>Fogja meg a <GripVertical size={16}/> ikonnal a menüpontot. A főmenük sorrendje és az almenük másik csoportba helyezése is menthető.</p></div><div className="menu-layout-actions"><button onClick={()=>setRoots(copyTree(original))} disabled={!dirty||saving}><Undo2/>Nem mentett módosítások vissza</button><button onClick={resetDefault} disabled={saving}><RotateCcw/>Alapértelmezés</button><button className="primary" onClick={save} disabled={!dirty||saving}><Save/>{saving?"Mentés…":"Mentés"}</button></div></header>
  {error&&<div className="menu-layout-alert error"><AlertTriangle/><span>{error}</span></div>}{notice&&<div className="menu-layout-alert ok"><CheckCircle2/><span>{notice}</span></div>}
  <section className="menu-layout-summary"><b>{roots.length}</b> főmenü · <b>{total-roots.length}</b> almenü <button onClick={()=>void load()} disabled={loading||saving}><RefreshCw className={loading?"spin":""}/>Frissítés</button></section>
  <div className="menu-root-drop" onDragOver={e=>e.preventDefault()} onDrop={()=>dropRoot(0)}>Húzza ide, ha főmenü szintre szeretné tenni</div>
  <section className="menu-layout-list">{roots.map((root,ri)=><React.Fragment key={root.id}>
   <div className="menu-root-insert" onDragOver={e=>e.preventDefault()} onDrop={()=>dropRoot(ri)}/>
   <article className="menu-root-card">
    <div className="menu-root-title" draggable onDragStart={()=>setDrag({id:root.id,parentId:null})} onDragEnd={()=>setDrag(null)}><GripVertical/><div><b>{displayName(root)}</b><small>{root.code||root.route||`#${root.id}`}</small></div><span>Főmenü</span></div>
    <div className="menu-children" onDragOver={e=>e.preventDefault()} onDrop={e=>{if(e.currentTarget===e.target)dropInto(root.id)}}>
     {(root.submenus||[]).map((child,ci)=><React.Fragment key={child.id}>
      <div className="menu-child-insert" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();dropInto(root.id,ci)}}/>
      <div className="menu-child" draggable onDragStart={e=>{e.stopPropagation();setDrag({id:child.id,parentId:root.id})}} onDragEnd={()=>setDrag(null)}><GripVertical/><div><b>{displayName(child)}</b><small>{child.route||child.code||`#${child.id}`}</small></div></div>
     </React.Fragment>)}
     <div className="menu-child-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();dropInto(root.id)}}>{root.submenus?.length?"Almenü hozzáadása / ide mozgatás":"Húzzon ide almenüpontot"}</div>
    </div>
   </article>
  </React.Fragment>)}<div className="menu-root-insert end" onDragOver={e=>e.preventDefault()} onDrop={()=>dropRoot(roots.length)}/></section>
 </main>
}