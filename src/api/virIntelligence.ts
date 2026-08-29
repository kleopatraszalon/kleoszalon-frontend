import api from "./api";

export type ProfitabilitySummary={revenue:number;material_cost:number;labor_cost:number;commission_cost:number;gross_profit:number;margin_percent:number;below_target:number;missing_recipe:number};
export type ProfitabilityLocation=ProfitabilitySummary&{location_id:string;location_name:string};
export type ProfitabilityService={service_id:string;service_name:string;revenue:number;material_cost:number;labor_cost:number;commission_cost:number;gross_profit:number;margin_percent:number;completed_lines:number;service_quantity:number;recipe_complete:boolean;below_target:boolean;profit_per_minute:number|null};
export type ProfitabilityResponse={ok:boolean;from:string;to:string;target_margin_percent:number;summary:ProfitabilitySummary;by_location:ProfitabilityLocation[];services:ProfitabilityService[];cost_model:{canonical_engine:string;includes_material_cost:boolean;includes_direct_labor:boolean;includes_commission_cost:boolean;cost_basis:string;excludes_employer_contributions_and_overhead:boolean}};
export type CapacityGap={employee_id:string;employee_name:string;location_id:string;start:string;end:string;minutes:number;estimated_value:number;schedule_source:string;waitlist_match?:{waitlist_id:string;client_name?:string;match_score:number;estimated_value:number;reasons:string[]} | null};
export type CapacityResponse={ok:boolean;horizon_days:number;summary:{gaps:number;gap_minutes:number;estimated_open_capacity_value:number;matched_gaps:number};gaps:CapacityGap[]};
export type NoShowCandidate={client_id:string;client_name:string;email?:string|null;phone?:string|null;location_id:string;visits:number;no_shows:number;cancellations:number;no_show_rate:number;score:number;level:"low"|"medium"|"high";reasons:string[];deposit?:{required:boolean;percent:number;amount:number;reason:string}};
export type NoShowResponse={ok:boolean;days:number;summary:{elevated:number;high:number;medium:number};candidates:NoShowCandidate[]};

export async function getVirProfitability(params:{from?:string;to?:string;targetMargin?:number;locationId?:string}){const r=await api.get<ProfitabilityResponse>("/vir/intelligence/profitability",{params});return r.data;}
export async function getVirCapacity(params:{horizonDays?:number;locationId?:string}){const r=await api.get<CapacityResponse>("/vir/intelligence/capacity",{params});return r.data;}
export async function getVirNoShow(params:{days?:number;locationId?:string}){const r=await api.get<NoShowResponse>("/vir/intelligence/no-show",{params});return r.data;}
