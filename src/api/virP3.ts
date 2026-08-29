import api from "./api";
export const getVirChurnRadar=(params:{locationId?:string})=>api.get('/vir/p3/churn-radar',{params}).then(r=>r.data);
export const getVirNextVisit=(params:{locationId?:string;horizonDays?:number})=>api.get('/vir/p3/next-visit',{params}).then(r=>r.data);
export const getVirSmartPricing=(params:{locationId?:string;days?:number})=>api.get('/vir/p3/smart-pricing',{params}).then(r=>r.data);
export const getVirMembershipIntelligence=(params:{locationId?:string})=>api.get('/vir/p3/membership-intelligence',{params}).then(r=>r.data);
