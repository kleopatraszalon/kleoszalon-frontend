import api from './api';
export const getP15Status=()=>api.get('/vir/p15/status').then(r=>r.data);
export const getP15CommandCenter=()=>api.get('/vir/p15/command-center').then(r=>r.data);
export const previewP15ActionPlan=(body:any)=>api.post('/vir/p15/action-plans/preview',body).then(r=>r.data);
export const getP15ActionPlans=()=>api.get('/vir/p15/action-plans').then(r=>r.data);
export const approveP15ActionPlan=(id:string)=>api.post(`/vir/p15/action-plans/${id}/approve`).then(r=>r.data);
