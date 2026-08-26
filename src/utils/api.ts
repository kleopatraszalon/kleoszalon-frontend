// src/utils/api.ts

import apiFetchRaw, {
  fetchJSON,
  fetchArray,
  safeJson,
  safeParse,
  toArray,
  getBaseUrl,
  withBase,
  authHeaders,
} from "./fetch";

export {
  fetchJSON,
  fetchArray,
  safeJson,
  safeParse,
  toArray,
  getBaseUrl,
  withBase,
  authHeaders,
};

export default apiFetchRaw;

const WORKORDER_ENTITY_KEY="kleo_workorder_legal_entity_id";
const WORKORDER_ENTITY_REQUIRED="kleo_workorder_company_selection_required";

function isWorkOrderCreate(input:string|Request){
 const url=typeof input==="string"?input:input.url;
 return /\/api\/transactions\/workorder-editor\/create(?:\?|$)/.test(url)||/\/transactions\/workorder-editor\/create(?:\?|$)/.test(url);
}
function storedWorkOrderEntity(){try{return{entity:sessionStorage.getItem(WORKORDER_ENTITY_KEY)||"",required:sessionStorage.getItem(WORKORDER_ENTITY_REQUIRED)==="1"}}catch{return{entity:"",required:false}}}
function clearWorkOrderEntity(){try{sessionStorage.removeItem(WORKORDER_ENTITY_KEY);sessionStorage.removeItem(WORKORDER_ENTITY_REQUIRED)}catch{}}

/**
 * Magasabb szintű helper:
 *  - ugyanazt a `apiFetchRaw`-t használja, mint a fetch.ts-ben
 *  - automatikusan `credentials: "include"`-dal hívja, hogy a "token" süti menjen
 *  - JSON-t próbál visszaadni generikus T típussal
 *  - új munkalapnál a munkalap tetején kiválasztott kibocsátó céget még a fizetés előtt hozzárendeli
 */
export async function apiFetch<T = any>(
  input: string | Request,
  init?: RequestInit
): Promise<T> {
  const company=isWorkOrderCreate(input)?storedWorkOrderEntity():{entity:"",required:false};
  if(company.required&&!company.entity)throw new Error("API hiba: Több cég érhető el. A munkalap lezárása előtt válassz kibocsátó céget.");

  const res = await apiFetchRaw(input, {
    credentials: "include",
    ...(init || {}),
  });

  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;

  try {
    const parsed=JSON.parse(text) as any;
    if(isWorkOrderCreate(input)&&parsed?.id&&company.entity){
      const assign=await apiFetchRaw(`/api/vir/receipt-compliance/legal-entities/workorders/${encodeURIComponent(String(parsed.id))}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({legal_entity_id:company.entity}),
        credentials:"include",
      });
      if(!assign.ok)throw new Error("A munkalap létrejött, de a kiválasztott cég hozzárendelése nem sikerült.");
      clearWorkOrderEntity();
    }
    return parsed as T;
  } catch (err) {
    if(err instanceof Error&&/kiválasztott cég|Több cég/.test(err.message))throw err;
    console.warn("apiFetch: nem JSON válasz, sima szövegként adom vissza", {input,status:res.status,text});
    return text as unknown as T;
  }
}