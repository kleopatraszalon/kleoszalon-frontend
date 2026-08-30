import api from "./api";
export const getVirWorkforceOptimizer=(params:{locationId?:string;days?:number})=>api.get('/vir/p4/workforce-optimizer',{params}).then(r=>r.data);
