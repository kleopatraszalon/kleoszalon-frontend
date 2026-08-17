import api from '../api/api';

export type TerminalTransaction={
  id:string;
  amount:number|string;
  currency:string;
  status:string;
  external_transaction_id?:string|null;
  approval_code?:string|null;
  receipt_reference?:string|null;
};

type TerminalIntentResponse={
  transaction:TerminalTransaction;
  terminal:{id:string;name:string;adapter_type:'SIMULATOR'|'LOCAL_BRIDGE'|'CLOUD_API';bridge_url?:string|null};
  command:{adapter_type:string;bridge_url?:string|null;payload:Record<string,unknown>};
};

export type TerminalSource=
 |{source_type:'WORK_ORDER';source_id:string;requested_amount?:number}
 |{source_type:'RETAIL_CART';location_id:string;items:Array<{product_id:string;quantity:number}>;cart_key?:string};

function errorMessage(error:any){
  return String(error?.response?.data?.message||error?.message||'A terminálművelet nem sikerült.');
}

export async function dispatchTerminalPayment(source:TerminalSource){
  try{
    const intentResponse=await api.post<TerminalIntentResponse>('/vir/device-control/payments/intent',source);
    const intent=intentResponse.data;
    if(intent.terminal.adapter_type==='SIMULATOR'){
      const simulated=await api.post<TerminalTransaction>(`/vir/device-control/payments/${intent.transaction.id}/simulate`);
      return{transaction:simulated.data,terminal:intent.terminal,simulator:true};
    }

    const bridgeUrl=String(intent.command?.bridge_url||intent.terminal.bridge_url||'').replace(/\/$/,'');
    if(!bridgeUrl)throw new Error('A fizikai terminálhoz nincs helyi bridge/API cím beállítva.');
    const bridgeResponse=await fetch(`${bridgeUrl}/payments`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(intent.command.payload)
    });
    let result:any={};
    try{result=await bridgeResponse.json()}catch{}
    if(!bridgeResponse.ok)throw new Error(result?.message||`A terminál bridge hibát jelzett (${bridgeResponse.status}).`);
    const signature=String(bridgeResponse.headers.get('x-vir-device-signature')||result?.signature||'');
    if(!signature)throw new Error('A terminál bridge nem adott VIR aláírást.');
    if(result&&typeof result==='object'&&'signature' in result){const{signature:_removed,...rest}=result;result=rest;}
    const verified=await api.post<TerminalTransaction>(`/vir/device-control/payments/${intent.transaction.id}/bridge-result`,{result,signature});
    return{transaction:verified.data,terminal:intent.terminal,simulator:false};
  }catch(error){throw new Error(errorMessage(error));}
}

export function terminalApprovalNote(transaction:TerminalTransaction,simulator=false){
  const parts=[simulator?'TESZT TERMINÁL':'Terminál',transaction.external_transaction_id||transaction.id];
  if(transaction.approval_code)parts.push(`engedély:${transaction.approval_code}`);
  return parts.join(' · ');
}
