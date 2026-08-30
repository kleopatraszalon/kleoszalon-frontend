import api from './api';
export const getP11Status=(params:any={})=>api.get('/vir/p11/status',{params}).then(r=>r.data);
export const previewP11Reception=(body:any)=>api.post('/vir/p11/receptionist/preview',body).then(r=>r.data);
export const getP11ConversationMemory=(clientId:string,params:any={})=>api.get(`/vir/p11/conversation-memory/${clientId}`,{params}).then(r=>r.data);
export const analyzeP11Complaint=(body:any)=>api.post('/vir/p11/complaints/analyze',body).then(r=>r.data);
export const getP11Complaints=(params:any={})=>api.get('/vir/p11/complaints',{params}).then(r=>r.data);
