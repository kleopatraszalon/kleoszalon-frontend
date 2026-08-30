import api from './api';
export const getP13Status=()=>api.get('/vir/p13/status').then(r=>r.data);
export const previewP13Protection=(body:any)=>api.post('/vir/p13/protection/preview',body).then(r=>r.data);
export const getP13LoyaltyHealth=(clientId:string)=>api.get(`/vir/p13/loyalty-health/${clientId}`).then(r=>r.data);
export const previewP13SaveOffer=(body:any)=>api.post('/vir/p13/save-offer/preview',body).then(r=>r.data);
