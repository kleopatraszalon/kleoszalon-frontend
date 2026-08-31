import api from './api';

export type VirLookupKind='clients'|'locations'|'work-orders';
export type VirLookupItem={id:string;label:string;phone?:string|null;email?:string|null;status?:string|null;location_id?:string|null};

export async function searchVirLookup(kind:VirLookupKind,q=''):Promise<VirLookupItem[]>{
  const {data}=await api.get(`/vir/lookups/${kind}`,{params:q?{q}:{}});
  return Array.isArray(data?.items)?data.items:[];
}

export async function getVirTenantContext(){
  const {data}=await api.get('/vir/lookups/context');
  return data;
}
