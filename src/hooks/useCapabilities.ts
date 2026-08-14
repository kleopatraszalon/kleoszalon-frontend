import { useCallback, useEffect, useState } from "react";
import api from "../api";

export type MenuCapability = {
  menu_id?: number;
  code?: string;
  configured?: boolean;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
  can_view_financial: boolean;
  can_manage_permissions: boolean;
  scope_type: string;
};

type CapabilityPayload = {
  admin: boolean;
  roles: string[];
  features: Record<string,{can_use:boolean;scope_type:string}>;
  menus: Record<string,MenuCapability>;
};

const fallback:CapabilityPayload={admin:false,roles:[],features:{},menus:{}};
const CAPABILITY_CACHE_MS=30000;
let cached:{token:string;data:CapabilityPayload;expiresAt:number}|null=null;
let pending:{token:string;promise:Promise<CapabilityPayload>}|null=null;

function token(){try{return localStorage.getItem("kleo_token")||localStorage.getItem("token")||""}catch{return ""}}
function warm(){const t=token();return cached&&cached.token===t&&cached.expiresAt>Date.now()?cached.data:null}
async function request(force=false){
  const t=token();
  if(!force){const hit=warm();if(hit)return hit;if(pending?.token===t)return pending.promise}
  const promise=api.get("/api/access-control/me/capabilities").then(r=>(r.data||fallback) as CapabilityPayload);
  pending={token:t,promise};
  try{const data=await promise;cached={token:t,data,expiresAt:Date.now()+CAPABILITY_CACHE_MS};return data}
  finally{if(pending?.promise===promise)pending=null}
}

export function useCapabilities(){
  const initial=warm();
  const[data,setData]=useState<CapabilityPayload>(initial||fallback);
  const[loading,setLoading]=useState(!initial);
  const[error,setError]=useState("");
  const load=useCallback(async(force=false)=>{
    if(!warm()||force)setLoading(true);setError("");
    try{setData(await request(force))}
    catch(e:any){setError(e?.response?.data?.error||e?.response?.data?.message||"A jogosultságok nem tölthetők be.")}
    finally{setLoading(false)}
  },[]);
  useEffect(()=>{void load(false)},[load]);
  const feature=(key:string)=>data.admin||Boolean(data.features?.[key]?.can_use);
  const menu=(code:string,action:keyof MenuCapability="can_view")=>{
    if(data.admin)return true;
    const cap=data.menus?.[code];
    if(!cap)return true;
    return Boolean(cap[action]);
  };
  return {data,loading,error,reload:()=>load(true),feature,menu};
}
