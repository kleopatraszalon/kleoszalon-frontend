export type UatCaseLike={
  id?:string;
  code:string;
  module_key?:string;
  title:string;
  description?:string;
  expected_result?:string;
  route?:string;
  critical?:boolean;
  status?:string;
  note?:string;
  requirement_id?:string;
  requirement_text?:string;
  acceptance_criteria?:string;
  source_reference?:string;
  owner_role?:string;
  priority?:string;
  verification_method?:string;
  catalog_requirement_id?:string;
  acceptance_criteria_id?:string;
  external_test_case_id?:string;
  evidence_required?:boolean;
  requirement_lifecycle_status?:string;
};

export type RequirementTrace={
  requirementId:string;
  acceptanceCriteriaId?:string;
  externalTestCaseId?:string;
  testCaseId?:string;
  testCode:string;
  module:string;
  title:string;
  requirement:string;
  acceptanceCriteria:string;
  sourceReference?:string;
  ownerRole?:string;
  lifecycleStatus?:string;
  verificationMethod:string;
  priority:'P0'|'P1'|'P2';
  critical:boolean;
  evidenceRequired:boolean;
  route?:string;
  testStatus:string;
  note?:string;
};

const clean=(value:string)=>value.toUpperCase().replace(/^UAT-/,'').replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
export function requirementIdFor(code:string){return `REQ-${clean(code)}`;}

function normalizePriority(value:string|undefined,critical:boolean,code:string):'P0'|'P1'|'P2'{
  const p=String(value||'').toUpperCase();
  if(p==='P0'||p==='MUST')return'P0';
  if(p==='P1'||p==='SHOULD')return'P1';
  if(p==='P2'||p==='COULD')return'P2';
  if(critical)return'P0';
  return code.includes('FIN-')||code.includes('RBAC-')||code.includes('GDPR-')?'P1':'P2';
}

export function toRequirementTrace(x:UatCaseLike):RequirementTrace{
  const critical=Boolean(x.critical);
  const status=x.status||'not_tested';
  const canonicalId=x.catalog_requirement_id?.trim()||x.requirement_id?.trim()||requirementIdFor(x.code);
  return{
    requirementId:canonicalId,
    acceptanceCriteriaId:x.acceptance_criteria_id?.trim()||undefined,
    externalTestCaseId:x.external_test_case_id?.trim()||undefined,
    testCaseId:x.id,
    testCode:x.code,
    module:x.module_key||'system',
    title:x.title,
    requirement:x.requirement_text?.trim()||x.description?.trim()||`${x.title} működése a VIR-ben igazolható legyen.`,
    acceptanceCriteria:x.acceptance_criteria?.trim()||x.expected_result?.trim()||'Az elvárt üzleti eredmény hiba nélkül, reprodukálhatóan teljesül.',
    sourceReference:x.source_reference?.trim()||undefined,
    ownerRole:x.owner_role?.trim()||undefined,
    lifecycleStatus:x.requirement_lifecycle_status?.trim()||undefined,
    verificationMethod:x.verification_method?.trim()||(x.code.includes('SYS-')||x.code.includes('RBAC-')||x.code.includes('FIN-')||x.code.includes('ACC-')?'AUTOMATED+UAT':'UAT'),
    priority:normalizePriority(x.priority,critical,x.code),
    critical,
    evidenceRequired:x.evidence_required!==false,
    route:x.route,
    testStatus:status,
    note:x.note,
  };
}

export type CoverageSummary={total:number;covered:number;passed:number;failed:number;blocked:number;notTested:number;criticalOpen:number;coveragePercent:number;passPercent:number;canonicalMapped:number;canonicalPercent:number;releaseReady:boolean};

export function summarizeTraceability(rows:RequirementTrace[]):CoverageSummary{
  const total=rows.length;
  const covered=rows.filter(x=>Boolean(x.testCode&&x.acceptanceCriteria)).length;
  const passed=rows.filter(x=>x.testStatus==='passed').length;
  const failed=rows.filter(x=>x.testStatus==='failed').length;
  const blocked=rows.filter(x=>x.testStatus==='blocked').length;
  const notTested=rows.filter(x=>!x.testStatus||x.testStatus==='not_tested').length;
  const criticalOpen=rows.filter(x=>x.critical&&x.testStatus!=='passed').length;
  const canonicalMapped=rows.filter(x=>/^KLEO-(GEN|FUN|NFR)-[A-Z0-9]+-\d{3}$/.test(x.requirementId)&&Boolean(x.acceptanceCriteriaId&&x.externalTestCaseId)).length;
  const coveragePercent=total?Math.round(covered*100/total):100;
  const passPercent=total?Math.round(passed*100/total):0;
  const canonicalPercent=total?Math.round(canonicalMapped*100/total):100;
  return{total,covered,passed,failed,blocked,notTested,criticalOpen,coveragePercent,passPercent,canonicalMapped,canonicalPercent,releaseReady:total>0&&coveragePercent===100&&canonicalPercent===100&&failed===0&&blocked===0&&notTested===0&&criticalOpen===0};
}

export function traceabilityCsv(rows:RequirementTrace[]){
  const q=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
  const header=['Requirement ID','Acceptance criterion ID','External test case ID','UAT code','Module','Priority','Critical','Evidence required','Requirement','Acceptance criteria','Source','Owner','Lifecycle','Verification','Status','Route','Note'];
  return[header.map(q).join(';'),...rows.map(x=>[x.requirementId,x.acceptanceCriteriaId||'',x.externalTestCaseId||'',x.testCode,x.module,x.priority,x.critical?'YES':'NO',x.evidenceRequired?'YES':'NO',x.requirement,x.acceptanceCriteria,x.sourceReference||'',x.ownerRole||'',x.lifecycleStatus||'',x.verificationMethod,x.testStatus,x.route||'',x.note||''].map(q).join(';'))].join('\n');
}
