import api from './api';
export const getP10DynamicOffers=(params:any)=>api.get('/vir/p10/dynamic-offers',{params}).then(r=>r.data);
export const getP10EmptySlotAutopilot=(params:any)=>api.get('/vir/p10/empty-slot-autopilot',{params}).then(r=>r.data);
export const getP10RevenueGuard=(params:any)=>api.get('/vir/p10/revenue-guard',{params}).then(r=>r.data);
export const getP10NextBestOffers=(params:any)=>api.get('/vir/p10/next-best-offers',{params}).then(r=>r.data);
export const simulateP10Promotion=(body:any)=>api.post('/vir/p10/promotion-simulator',body).then(r=>r.data);
