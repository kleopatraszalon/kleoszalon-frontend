import api from "./api";
export const postAiReceptionistPreview=(body:any)=>api.post('/vir/p6/ai-receptionist/preview',body).then(r=>r.data);
export const getIntelligentScheduling=(params:any)=>api.get('/vir/p6/intelligent-scheduling',{params}).then(r=>r.data);
export const getBookingRecovery=(params:any)=>api.get('/vir/p6/booking-recovery',{params}).then(r=>r.data);
export const getAgentGatewayCapabilities=(params:any)=>api.get('/vir/p6/agent-gateway/capabilities',{params}).then(r=>r.data);
export const getAgentGatewayAvailability=(params:any)=>api.get('/vir/p6/agent-gateway/availability',{params}).then(r=>r.data);
export const getExternalCompetitorIntelligence=(params:any)=>api.get('/vir/p6/external-competitor-intelligence',{params}).then(r=>r.data);
export const postConsultationPreview=(body:any)=>api.post('/vir/p6/consultation/preview',body).then(r=>r.data);
