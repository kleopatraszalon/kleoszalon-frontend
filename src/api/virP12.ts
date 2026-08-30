import api from './api';
export const getP12Status=()=>api.get('/vir/p12/status').then(r=>r.data);
export const getP12Journey=(clientId:string)=>api.get(`/vir/p12/journey/${clientId}`).then(r=>r.data);
export const getP12NextStep=(clientId:string)=>api.get(`/vir/p12/next-step/${clientId}`).then(r=>r.data);
export const getP12RecoveryQueue=()=>api.get('/vir/p12/recovery-queue').then(r=>r.data);
