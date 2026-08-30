import api from "./api";
type P={locationId?:string;days?:number};
export const getVirWorkforceOptimizer=(params:P)=>api.get('/vir/p4/workforce-optimizer',{params}).then(r=>r.data);
export const getVirSmartShiftGenerator=(params:P)=>api.get('/vir/p4/smart-shift-generator',{params}).then(r=>r.data);
export const getVirEmployeeRevenueCoach=(params:P)=>api.get('/vir/p4/employee-revenue-coach',{params}).then(r=>r.data);
export const getVirServicePortfolio=(params:P)=>api.get('/vir/p4/service-portfolio',{params}).then(r=>r.data);
export const getVirCannibalization=(params:P)=>api.get('/vir/p4/cannibalization',{params}).then(r=>r.data);
