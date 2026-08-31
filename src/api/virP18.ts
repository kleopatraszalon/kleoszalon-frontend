import api from './api';

export type P18Proposal={id:string;tenant_id:string;location_id?:string|null;proposal_key:string;source_type:string;operation_type:string;title:string;reason:string;priority:'low'|'medium'|'high'|'critical';confidence:number;status:'proposed'|'promoted'|'dismissed';promoted_operation_id?:string|null;created_at:string};

export const getP18Status=()=>api.get('/vir/p18/status').then(r=>r.data);
export const getP18Proposals=(params?:{status?:string})=>api.get('/vir/p18/proposals',{params}).then(r=>r.data);
export const generateP18Proposals=(body?:{locationId?:string})=>api.post('/vir/p18/generate',body||{}).then(r=>r.data);
export const promoteP18Proposal=(id:string)=>api.post(`/vir/p18/proposals/${id}/promote`).then(r=>r.data);
export const dismissP18Proposal=(id:string)=>api.post(`/vir/p18/proposals/${id}/dismiss`).then(r=>r.data);
