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

export function useCapabilities(){
  const[data,setData]=useState<CapabilityPayload>(fallback);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{const r=await api.get("/api/access-control/me/capabilities");setData(r.data||fallback)}
    catch(e:any){setError(e?.response?.data?.error||e?.response?.data?.message||"A jogosultságok nem tölthetők be.")}
    finally{setLoading(false)}
  },[]);
  useEffect(()=>{void load()},[load]);
  const feature=(key:string)=>data.admin||Boolean(data.features?.[key]?.can_use);
  const menu=(code:string,action:keyof MenuCapability="can_view")=>{
    if(data.admin)return true;
    const cap=data.menus?.[code];
    if(!cap)return true; // kompatibilis, amíg a menümigráció nincs konfigurálva
    return Boolean(cap[action]);
  };
  return {data,loading,error,reload:load,feature,menu};
}
