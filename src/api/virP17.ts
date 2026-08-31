import api from './api';

export type P17OperationType='capacity_review'|'staffing_review'|'inventory_review'|'revenue_review'|'customer_retention_review'|'manual_task';
export type P17Status='pending_approval'|'approved'|'executed'|'verified'|'rolled_back'|'rejected';
export type P17Operation={id:string;tenant_id:string;location_id?:string|null;operation_type:P17OperationType;title:string;status:P17Status;risk_level:'low'|'medium'|'high'|'critical';source_layer?:string;source_ref?:string|null;created_at:string;updated_at:string};

export const getP17Status=()=>api.get('/vir/p17/status').then(r=>r.data);
export const getP17Operations=(params?:{status?:P17Status;locationId?:string})=>api.get('/vir/p17/operations',{params}).then(r=>r.data);
export const previewP17Operation=(body:{operation_type:P17OperationType;title:string;locationId?:string})=>api.post('/vir/p17/preview',body).then(r=>r.data);
export const createP17Operation=(body:{operation_type:P17OperationType;title:string;locationId?:string;idempotency_key?:string;preview_payload?:Record<string,unknown>;source_layer?:string;source_ref?:string})=>api.post('/vir/p17/operations',body).then(r=>r.data);
export const approveP17Operation=(id:string,payload?:Record<string,unknown>)=>api.post(`/vir/p17/operations/${id}/approve`,{payload}).then(r=>r.data);
export const executeP17Operation=(id:string,payload?:Record<string,unknown>)=>api.post(`/vir/p17/operations/${id}/execute`,{payload}).then(r=>r.data);
export const verifyP17Operation=(id:string,payload?:Record<string,unknown>)=>api.post(`/vir/p17/operations/${id}/verify`,{payload}).then(r=>r.data);
export const rollbackP17Operation=(id:string,payload?:Record<string,unknown>)=>api.post(`/vir/p17/operations/${id}/rollback`,{payload}).then(r=>r.data);
export const rejectP17Operation=(id:string)=>api.post(`/vir/p17/operations/${id}/reject`).then(r=>r.data);
