import api from "./api";
export const getVirDigitalTwin=(params:any)=>api.get('/vir/p5/digital-twin',{params}).then(r=>r.data);
export const postVirGoalAction=(body:any)=>api.post('/vir/p5/goal-action',body).then(r=>r.data);
export const postVirActionPreview=(body:any)=>api.post('/vir/p5/action-preview',body).then(r=>r.data);
export const getVirCompetitorIntelligence=(params:any)=>api.get('/vir/p5/competitor-intelligence',{params}).then(r=>r.data);
export const getVirLocationExpansion=(params:any)=>api.get('/vir/p5/location-expansion',{params}).then(r=>r.data);
