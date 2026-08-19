export type CanonicalRole =
  | "admin"
  | "manager"
  | "location_manager"
  | "salon_manager"
  | "receptionist"
  | "employee"
  | "accounting"
  | "customer";

const aliases: Record<string, CanonicalRole> = {
  admin:"admin",administrator:"admin",rendszergazda:"admin",superadmin:"admin",super_admin:"admin",
  manager:"manager","vezető":"manager",vezeto:"manager",
  location_manager:"location_manager",business_manager:"location_manager","üzletvezető":"location_manager",uzletvezeto:"location_manager",store_manager:"location_manager",branch_manager:"location_manager",
  salon_manager:"salon_manager","szalonvezető":"salon_manager",szalonvezeto:"salon_manager",
  receptionist:"receptionist",reception:"receptionist","recepciós":"receptionist",recepcios:"receptionist",
  employee:"employee",staff:"employee",worker:"employee","munkatárs":"employee",munkatars:"employee",colleague:"employee",
  accounting:"accounting",bookkeeper:"accounting","könyvelés":"accounting",konyveles:"accounting",
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

/**
 * UI-only role hint. This value is intentionally non-authoritative and may be
 * modified by the browser user. Backend RBAC and /api/me remain the security
 * boundary. The legacy export name is retained to avoid a broad router rewrite.
 */
export function rolesFromStoredToken():string[]{
  try{
    return parseRoles(localStorage.getItem("kleo_role"));
  }catch{return[]}
}

export function hasStoredRole(allowed: readonly string[]):boolean{
  const wanted=new Set(allowed.map(normalizeRole));
  const actual=rolesFromStoredToken();
  if(actual.some(role=>wanted.has(role)))return true;
  // A könyvelő átmehet az admin/management route guardon, ha az oldal könyvelési eszköz.
  // Az AccessBoundary könyvelői whitelistje és az API RBAC együtt akadályozza meg a globális adminhozzáférést.
  if(actual.includes("accounting")&&(wanted.has("manager")||wanted.has("admin")))return true;
  return false;
}