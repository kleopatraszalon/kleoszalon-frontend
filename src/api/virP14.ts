import api from './api';
export const getP14Status=()=>api.get('/vir/p14/status').then(r=>r.data);
export const getP14WorkforcePressure=()=>api.get('/vir/p14/workforce-pressure').then(r=>r.data);
export const getP14CapacityGaps=()=>api.get('/vir/p14/capacity-gaps').then(r=>r.data);
export const getP14ServiceBottlenecks=()=>api.get('/vir/p14/service-bottlenecks').then(r=>r.data);
export const previewP14ShiftPlan=(body:any)=>api.post('/vir/p14/shift-plan/preview',body).then(r=>r.data);
