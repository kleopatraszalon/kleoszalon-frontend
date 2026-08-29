import api from "./api";
export const askVirCopilot=(payload:{question:string;date?:string;locationId?:string})=>api.post('/vir/p2/copilot/ask',payload).then(r=>r.data);
export const getVirAnomalies=(params:{date?:string;locationId?:string})=>api.get('/vir/p2/anomalies',{params}).then(r=>r.data);
export const getVirSummaries=(params:{date?:string;locationId?:string})=>api.get('/vir/p2/summaries',{params}).then(r=>r.data);
export const getVirBenchmark=(params:{days?:number;locationId?:string})=>api.get('/vir/p2/benchmark',{params}).then(r=>r.data);
