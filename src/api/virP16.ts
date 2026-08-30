import api from './api';
export const getP16Status=()=>api.get('/vir/p16/status').then(r=>r.data);
export const getP16ExceptionBrief=()=>api.get('/vir/p16/exception-brief').then(r=>r.data);
export const syncP16DecisionInbox=()=>api.post('/vir/p16/decision-inbox/sync').then(r=>r.data);
export const getP16DecisionInbox=()=>api.get('/vir/p16/decision-inbox').then(r=>r.data);
export const decideP16=(id:string,status:'accepted'|'dismissed')=>api.post(`/vir/p16/decision-inbox/${id}/decide`,{status}).then(r=>r.data);
export const getP16MorningBrief=()=>api.get('/vir/p16/morning-brief').then(r=>r.data);
