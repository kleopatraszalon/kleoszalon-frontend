import api from './api';

export type P19Forecast={model:string;horizon_days:7|30|90;confidence:number;revenue_forecast:number;booking_forecast:number;no_show_risk_percent:number;capacity_pressure:'low'|'normal'|'high'|'critical';drivers:Record<string,number>;limitations:string[]};

export const getP19Status=()=>api.get('/vir/p19/status').then(r=>r.data);
export const getP19Forecast=(params:{days:7|30|90;locationId?:string})=>api.get('/vir/p19/forecast',{params}).then(r=>r.data);
export const createP19Snapshot=(body:{days:7|30|90;locationId?:string})=>api.post('/vir/p19/snapshot',body).then(r=>r.data);
export const getP19Snapshots=()=>api.get('/vir/p19/snapshots').then(r=>r.data);
export const getP19ExecutiveBrief=(params?:{locationId?:string})=>api.get('/vir/p19/executive-brief',{params}).then(r=>r.data);
