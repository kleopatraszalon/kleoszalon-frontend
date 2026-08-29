import api from "./api";
export const getCustomer360=(params:any)=>api.get("/vir/p1/customer-360",{params}).then(r=>r.data);
export const getForecast=(params:any)=>api.get("/vir/p1/forecast",{params}).then(r=>r.data);
export const getInventoryIntelligence=(params:any)=>api.get("/vir/p1/inventory-intelligence",{params}).then(r=>r.data);
export const getSimulator=(params:any)=>api.get("/vir/p1/simulator",{params}).then(r=>r.data);
export const getCompetencyMatrix=()=>api.get("/employees/skill-matrix").then(r=>r.data);
