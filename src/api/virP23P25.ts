import api from './api';

export type DigitalTwin={model:string;generated_at:string;completeness:number;coverage:Record<string,boolean>;scope:{tenant_id:string;location_id?:string|null;locations:Array<{id:string;name:string}>};demand:{history_30d:Record<string,number>;upcoming_bookings_30d:number;upcoming_booked_value_30d:number;forecast_30d:{revenue:number;bookings:number;lower:number;upper:number;confidence:number;mape_percent:number}};capacity:{active_staff:number;open_gaps_14d:number;open_minutes_14d:number;open_value_14d:number;pressure:string};customer_risk:{risk_candidates_14d:number;high_no_show_risk_14d:number;no_show_percent_30d:number};financial:{revenue_30d:number;material_cost_30d:number;labor_cost_30d:number;commission_cost_30d:number;gross_profit_30d:number;margin_percent:number};inventory:{balances:number;out_of_stock:number;low_stock:number;stock_value:number;risk_ratio:number};governance:{production_mutation:boolean;approval_layer:string;simulation_only:boolean}};
export type ScenarioLevers={price_delta_percent:number;staff_hours_delta_percent:number;promotion_discount_percent:number;no_show_reduction_percent:number;stock_availability_delta_percent:number;demand_delta_percent:number};
export type ScenarioSimulation={model:string;levers:ScenarioLevers;baseline:Record<string,number>;result:Record<string,number>;delta:Record<string,number>;confidence:number;assumptions:string[]};
export type OptimizerCandidate={score:number;levers:ScenarioLevers;result:Record<string,number>;delta:Record<string,number>;confidence:number};
export type OptimizerResult={model:string;weights:Record<string,number>;constraints:Record<string,number>;candidate_count:number;champion:OptimizerCandidate;alternatives:OptimizerCandidate[];governance:{direct_execution:boolean;approval_required:boolean;approval_layer:string}};

const base='/vir/intelligence';
export const getP23Status=()=>api.get(`${base}/p23/status`).then(r=>r.data);
export const getDigitalTwin=(params?:{locationId?:string})=>api.get(`${base}/p23/twin`,{params}).then(r=>r.data);
export const createDigitalTwinSnapshot=(body?:{locationId?:string})=>api.post(`${base}/p23/snapshot`,body||{}).then(r=>r.data);
export const getDigitalTwinSnapshots=()=>api.get(`${base}/p23/snapshots`).then(r=>r.data);
export const getP24Status=()=>api.get(`${base}/p24/status`).then(r=>r.data);
export const simulateBusinessScenario=(body:{locationId?:string;scenario_name?:string;levers:Partial<ScenarioLevers>;twin_snapshot_id?:string})=>api.post(`${base}/p24/simulate`,body).then(r=>r.data);
export const getScenarioRuns=()=>api.get(`${base}/p24/runs`).then(r=>r.data);
export const getP25Status=()=>api.get(`${base}/p25/status`).then(r=>r.data);
export const optimizeBusiness=(body:{locationId?:string;objective_weights?:Record<string,number>;constraints?:Record<string,number>})=>api.post(`${base}/p25/optimize`,body).then(r=>r.data);
export const getOptimizationRuns=()=>api.get(`${base}/p25/runs`).then(r=>r.data);
export const promoteOptimization=(id:string)=>api.post(`${base}/p25/runs/${id}/promote`).then(r=>r.data);
export const dismissOptimization=(id:string)=>api.post(`${base}/p25/runs/${id}/dismiss`).then(r=>r.data);