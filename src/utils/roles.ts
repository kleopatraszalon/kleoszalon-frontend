export type CanonicalRole =
  | "admin"
  | "manager"
  | "location_manager"
  | "salon_manager"
  | "receptionist"
  | "employee"
  | "customer";

const aliases: Record<string, CanonicalRole> = {
  admin:"admin",administrator:"admin",rendszergazda:"admin",superadmin:"admin",super_admin:"admin",
  manager:"manager","vezető":"manager",vezeto:"manager",
  location_manager:"location_manager",business_manager:"location_manager","üzletvezető":"location_manager",uzletvezeto:"location_manager",store_manager:"location_manager",branch_manager:"location_manager",
  salon_manager:"salon_manager","szalonvezető":"salon_manager",szalonvezeto:"salon_manager",
  receptionist:"receptionist",reception:"receptionist","recepciós":"receptionist",recepcios:"receptionist",
  employee:"employee",staff:"employee",worker:"employee","munkatárs":"employee",munkatars:"employee",colleague:"employee",
  customer:"customer",client:"customer",guest:"customer","ügyfél":"customer",ugyfel:"customer","vendég":"customer",vendeg:"customer",
};

export function normalizeRole(value: unknown): string {
  const key=String(value??"").trim().toLowerCase();
  return aliases[key]||key;
}

export function parseRoles(raw: unknown): string[] {
  let values: unknown[]=[];
  if(Array.isArray(raw)) values=raw;
  else {
    const text=String(raw??"").trim();
    if(!text)return[];
    try{const parsed=JSON.parse(text);values=Array.isArray(parsed)?parsed:[parsed]}
    catch{values=text.split(",").map(x=>x.replace(/[\[\]"]/g,"").trim())}
  }
  return Array.from(new Set(values.map(normalizeRole).filter(Boolean)));
}

function decodePayload(token:string):any{
  try{
    const part=token.split(".")[1];if(!part)return null;
    const base64=part.replace(/-/g,"+").replace(/_/g,"/");
    const padded=base64+"=".repeat((4-base64.length%4)%4);
    return JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(padded),(c:string)=>`%${("00"+c.charCodeAt(0).toString(16)).slice(-2)}`).join("")));
  }catch{return null}
}

export function rolesFromStoredToken():string[]{
  try{
    const token=localStorage.getItem("kleo_token")||localStorage.getItem("token");
    if(!token)return[];
    return parseRoles(decodePayload(token)?.role);
  }catch{return[]}
}

export function hasStoredRole(allowed: readonly string[]):boolean{
  const wanted=new Set(allowed.map(normalizeRole));
  return rolesFromStoredToken().some(role=>wanted.has(role));
}
