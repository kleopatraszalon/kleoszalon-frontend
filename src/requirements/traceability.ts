export type UatCaseLike={id?:string;code:string;module_key?:string;title:string;description?:string;expected_result?:string;route?:string;critical?:boolean;status?:string;note?:string};

export type RequirementTrace={
  requirementId:string;
  testCaseId?:string;
  testCode:string;
  module:string;
  title:string;
  requirement:string;
  acceptanceCriteria:string;
  verificationMethod:'UAT'|'AUTOMATED+UAT';
  priority:'P0'|'P1'|'P2';
  critical:boolean;
  route?:string;
  testStatus:string;
  note?:string;
};

const clean=(value:string)=>value.toUpperCase().replace(/^UAT-/,'').replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');

export function requirementIdFor(code:string){return `REQ-${clean(code)}`;}

export function toRequirementTrace(x:UatCaseLike):RequirementTrace{
  const critical=Boolean(x.critical);
  const status=x.status||'not_tested';
  return{
    requirementId:requirementIdFor(x.code),
    testCaseId:x.id,
    testCode:x.code,
    module:x.module_key||'system',
    title:x.title,
    requirement:x.description?.trim()||`${x.title} működése a VIR-ben igazolható legyen.`,
    acceptanceCriteria:x.expected_result?.trim()||'Az elvárt üzleti eredmény hiba nélkül, reprodukálhatóan teljesül.',
    verificationMethod:x.code.includes('SYS-')||x.code.includes('RBAC-')||x.code.includes('FIN-')||x.code.includes('ACC-')?'AUTOMATED+UAT':'UAT',
    priority:critical?'P0':x.code.includes('FIN-')||x.code.includes('RBAC-')||x.code.includes('GDPR-')?'P1':'P2',
    critical,
    route:x.route,
    testStatus:status,
    note:x.note,
  };
}

export type CoverageSummary={total:number;covered:number;passed:number;failed:number;blocked:number;notTested:number;criticalOpen:number;coveragePercent:number;passPercent:number;releaseReady:boolean};

export function summarizeTraceability(rows:RequirementTrace[]):CoverageSummary{
  const total=rows.length;
  const covered=rows.filter(x=>Boolean(x.testCode&&x.acceptanceCriteria)).length;
  const passed=rows.filter(x=>x.testStatus==='passed').length;
  const failed=rows.filter(x=>x.testStatus==='failed').length;
  const blocked=rows.filter(x=>x.testStatus==='blocked').length;
  const notTested=rows.filter(x=>!x.testStatus||x.testStatus==='not_tested').length;
  const criticalOpen=rows.filter(x=>x.critical&&x.testStatus!=='passed').length;
  const coveragePercent=total?Math.round(covered*100/total):100;
  const passPercent=total?Math.round(passed*100/total):0;
  return{total,covered,passed,failed,blocked,notTested,criticalOpen,coveragePercent,passPercent,releaseReady:total>0&&coveragePercent===100&&failed===0&&blocked===0&&notTested===0&&criticalOpen===0};
}

export function traceabilityCsv(rows:RequirementTrace[]){
  const q=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
  const header=['Requirement ID','Test code','Module','Priority','Critical','Requirement','Acceptance criteria','Verification','Status','Route','Note'];
  return[header.map(q).join(';'),...rows.map(x=>[x.requirementId,x.testCode,x.module,x.priority,x.critical?'YES':'NO',x.requirement,x.acceptanceCriteria,x.verificationMethod,x.testStatus,x.route||'',x.note||''].map(q).join(';'))].join('\n');
}
