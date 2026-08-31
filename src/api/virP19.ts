import api from './api';

export type P19Forecast={model:string;horizon_days:7|30|90;confidence:number;revenue_forecast:number;booking_forecast:number;no_show_risk_percent:number;capacity_pressure:'low'|'normal'|'high'|'critical';drivers:Record<string,number>;limitations:string[]};
export type P20Forecast={model:string;horizon_days:7|30|90;history_days:number;confidence:number;revenue_forecast:number;revenue_lower:number;revenue_upper:number;booking_forecast:number;metrics:{mae:number;mape_percent:number;holdout_days:number;revenue_momentum:number;booking_momentum:number;revenue_daily_slope:number;booking_daily_slope:number};daily:Array<{day:string;revenue:number;bookings:number;lower:number;upper:number}>;limitations:string[]};
export type P21Decision={id:string;operation_type:string;title:string;rationale:string;priority:'low'|'medium'|'high'|'critical';confidence:number;score:number;expected_impact:Record<string,unknown>;evidence:Record<string,unknown>;alternatives:string[];risks:string[];learning:Record<string,unknown>;status:'proposed'|'promoted'|'dismissed';promoted_operation_id?:string|null};
export type P22Cycle={id:string;decision_id:string;operation_id:string;operation_type:string;decision_title?:string;operation_status?:string;observation_days:number;baseline:Record<string,number>;outcome:Record<string,number>;optimization_score?:number|null;outcome_class?:'positive'|'neutral'|'negative'|null;status:'observing'|'evaluated'|'cancelled'};

export const getP19Status=()=>api.get('/vir/p19/status').then(r=>r.data);
export const getP19Forecast=(params:{days:7|30|90;locationId?:string})=>api.get('/vir/p19/forecast',{params}).then(r=>r.data);
export const createP19Snapshot=(body:{days:7|30|90;locationId?:string})=>api.post('/vir/p19/snapshot',body).then(r=>r.data);
export const getP19Snapshots=()=>api.get('/vir/p19/snapshots').then(r=>r.data);
export const getP19ExecutiveBrief=(params?:{locationId?:string})=>api.get('/vir/p19/executive-brief',{params}).then(r=>r.data);

export const getP20Status=()=>api.get('/vir/p20/status').then(r=>r.data);
export const getP20Forecast=(params:{days:7|30|90;locationId?:string})=>api.get('/vir/p20/forecast',{params}).then(r=>r.data);
export const runP20Model=(body:{days:7|30|90;locationId?:string})=>api.post('/vir/p20/run',body).then(r=>r.data);
export const getP20Runs=()=>api.get('/vir/p20/runs').then(r=>r.data);

export const getP21Status=()=>api.get('/vir/p21/status').then(r=>r.data);
export const getP21Decisions=()=>api.get('/vir/p21/decisions').then(r=>r.data);
export const generateP21Decisions=(body?:{locationId?:string})=>api.post('/vir/p21/generate',body||{}).then(r=>r.data);
export const promoteP21Decision=(id:string)=>api.post(`/vir/p21/decisions/${id}/promote`).then(r=>r.data);
export const dismissP21Decision=(id:string)=>api.post(`/vir/p21/decisions/${id}/dismiss`).then(r=>r.data);

export const getP22Status=()=>api.get('/vir/p22/status').then(r=>r.data);
export const getP22Cycles=()=>api.get('/vir/p22/cycles').then(r=>r.data);
export const syncP22Cycles=()=>api.post('/vir/p22/sync').then(r=>r.data);
export const evaluateP22Cycle=(id:string,allowEarly=false)=>api.post(`/vir/p22/cycles/${id}/evaluate`,{allow_early_evaluation:allowEarly}).then(r=>r.data);
export const getP22Policy=()=>api.get('/vir/p22/policy').then(r=>r.data);
