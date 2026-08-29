import api from "./api";
export const getVirRevenueLeakage=(params:{locationId?:string;days?:number})=>api.get('/vir/p3/revenue-leakage',{params}).then(r=>r.data);
