import api from './api';

const BASE='/transactions/operations-quality/improvement';

export type ImprovementProject={
  id:string;code:string;title:string;problem_statement?:string|null;objective?:string|null;methodology?:string[];analysis_data?:Record<string,any>;
  owner_employee_id?:string|null;owner_name?:string|null;location_id?:string|null;priority:'low'|'normal'|'high'|'critical';
  status:'draft'|'active'|'review'|'approved'|'closed'|'cancelled';start_date?:string|null;due_date?:string|null;
  approval_state:'not_requested'|'pending'|'approved'|'rejected';approval_requested_by?:string|null;approval_requested_at?:string|null;
  approved_by?:string|null;approved_at?:string|null;rejected_by?:string|null;rejected_at?:string|null;approval_comment?:string|null;
  open_actions?:number;capa_actions?:number;kpi_count?:number;overdue_actions?:number;created_at?:string;updated_at?:string;
};
export type ImprovementAction={id:string;project_id:string;action_type:'correction'|'corrective'|'preventive'|'improvement';title:string;description?:string|null;root_cause?:string|null;owner_employee_id?:string|null;owner_name?:string|null;due_date?:string|null;status:'open'|'in_progress'|'completed'|'verified'|'cancelled';effectiveness_criteria?:string|null;effectiveness_result?:string|null;completed_at?:string|null;verified_by?:string|null;verified_at?:string|null;};
export type ImprovementKpi={id:string;project_id:string;metric_key?:string|null;name:string;unit?:string|null;direction:'higher_better'|'lower_better'|'target';before_value?:number|null;target_value?:number|null;after_value?:number|null;before_at?:string|null;after_at?:string|null;source?:string|null;notes?:string|null;improvement_value?:number|null;};
export type ImprovementApproval={id:string;decision:'pending'|'approved'|'rejected'|'withdrawn';requested_by:string;requested_at:string;decided_by?:string|null;decided_at?:string|null;comment?:string|null;};
export type ImprovementAudit={id:number;entity_type:string;entity_id:string;action:string;actor:string;actor_user_id?:string|null;changes?:Record<string,any>;request_ip?:string|null;created_at:string;};
export type ImprovementDetail={project:ImprovementProject;actions:ImprovementAction[];kpis:ImprovementKpi[];approvals:ImprovementApproval[];audit:ImprovementAudit[]};
export type ImprovementEmployee={id:string;full_name:string;position_id?:string;location_id?:string};
export type ImprovementDashboard={total:number;active:number;awaiting_approval:number;overdue:number;closed:number;open_capa:number;overdue_actions:number};

export async function listImprovementProjects(params:Record<string,any>={}){return (await api.get<ImprovementProject[]>(`${BASE}/projects`,{params})).data}
export async function getImprovementProject(id:string){return (await api.get<ImprovementDetail>(`${BASE}/projects/${id}`)).data}
export async function createImprovementProject(body:Partial<ImprovementProject>){return (await api.post<ImprovementProject>(`${BASE}/projects`,body)).data}
export async function updateImprovementProject(id:string,body:Partial<ImprovementProject>){return (await api.patch<ImprovementProject>(`${BASE}/projects/${id}`,body)).data}
export async function listImprovementEmployees(){return (await api.get<ImprovementEmployee[]>(`${BASE}/employees`)).data}
export async function getImprovementDashboard(){return (await api.get<ImprovementDashboard>(`${BASE}/dashboard`)).data}
export async function createImprovementAction(projectId:string,body:Partial<ImprovementAction>){return (await api.post<ImprovementAction>(`${BASE}/projects/${projectId}/actions`,body)).data}
export async function updateImprovementAction(projectId:string,id:string,body:Partial<ImprovementAction>){return (await api.patch<ImprovementAction>(`${BASE}/projects/${projectId}/actions/${id}`,body)).data}
export async function deleteImprovementAction(projectId:string,id:string){return (await api.delete(`${BASE}/projects/${projectId}/actions/${id}`)).data}
export async function createImprovementKpi(projectId:string,body:Partial<ImprovementKpi>){return (await api.post<ImprovementKpi>(`${BASE}/projects/${projectId}/kpis`,body)).data}
export async function updateImprovementKpi(projectId:string,id:string,body:Partial<ImprovementKpi>){return (await api.patch<ImprovementKpi>(`${BASE}/projects/${projectId}/kpis/${id}`,body)).data}
export async function deleteImprovementKpi(projectId:string,id:string){return (await api.delete(`${BASE}/projects/${projectId}/kpis/${id}`)).data}
export async function requestImprovementApproval(projectId:string,comment=''){return (await api.post(`${BASE}/projects/${projectId}/request-approval`,{comment})).data}
export async function approveImprovementProject(projectId:string,body:{comment?:string;override_reason?:string}={}){return (await api.post(`${BASE}/projects/${projectId}/approve`,body)).data}
export async function rejectImprovementProject(projectId:string,comment:string){return (await api.post(`${BASE}/projects/${projectId}/reject`,{comment})).data}
export async function closeImprovementProject(projectId:string){return (await api.post(`${BASE}/projects/${projectId}/close`,{})).data}
