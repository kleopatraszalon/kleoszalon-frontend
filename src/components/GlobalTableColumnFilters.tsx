import { useEffect } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import "./GlobalTableColumnFilters.css";

const FILTER_ROW_ATTR="data-kleo-column-filters";
const BOUND_ATTR="data-kleo-column-filter-bound";

function cleanText(value:string){return value.replace(/\s+/g," ").trim().toLocaleLowerCase();}
function dataRows(table:HTMLTableElement){
  const body=table.tBodies.item(0);
  if(!body)return [] as HTMLTableRowElement[];
  return Array.from(body.rows).filter(row=>!row.hasAttribute("data-kleo-generated-row"));
}
function applyFilters(table:HTMLTableElement){
  const row=table.tHead?.querySelector<HTMLTableRowElement>(`tr[${FILTER_ROW_ATTR}]`);
  if(!row)return;
  const values=Array.from(row.querySelectorAll<HTMLInputElement>("input[data-kleo-column-filter]")).map(input=>cleanText(input.value));
  for(const tr of dataRows(table)){
    const cells=Array.from(tr.cells);
    const visible=values.every((needle,index)=>!needle||cleanText(cells[index]?.textContent||"").includes(needle));
    tr.hidden=!visible;
    tr.toggleAttribute("data-kleo-filtered-out",!visible);
  }
}
function filterable(table:HTMLTableElement){
  if(table.dataset.noColumnFilters==="true")return false;
  const header=table.tHead?.rows.item(0);
  return Boolean(header&&header.cells.length&&table.tBodies.length);
}
function bindTable(table:HTMLTableElement,placeholder:string){
  if(!filterable(table))return;
  const head=table.tHead!;
  const first=head.rows.item(0)!;
  let filterRow=head.querySelector<HTMLTableRowElement>(`tr[${FILTER_ROW_ATTR}]`);
  if(filterRow&&filterRow.cells.length!==first.cells.length){filterRow.remove();filterRow=null;}
  if(!filterRow){
    filterRow=document.createElement("tr");
    filterRow.setAttribute(FILTER_ROW_ATTR,"true");
    filterRow.setAttribute("data-kleo-generated-row","true");
    filterRow.className="kleo-global-column-filter-row";
    Array.from(first.cells).forEach((header,index)=>{
      const th=document.createElement("th");
      th.className="kleo-global-column-filter-cell";
      const input=document.createElement("input");
      input.type="search";
      input.dataset.kleoColumnFilter=String(index);
      input.placeholder=placeholder;
      input.setAttribute("aria-label",`${placeholder}: ${String(header.textContent||index+1).trim()}`);
      input.autocomplete="off";
      th.appendChild(input);
      filterRow!.appendChild(th);
    });
    head.appendChild(filterRow);
  }
  filterRow.querySelectorAll<HTMLInputElement>("input[data-kleo-column-filter]").forEach(input=>{input.placeholder=placeholder;});
  if(table.getAttribute(BOUND_ATTR)!=="true"){
    table.setAttribute(BOUND_ATTR,"true");
    table.addEventListener("input",event=>{
      const target=event.target as HTMLElement|null;
      if(!(target instanceof HTMLInputElement)||!target.hasAttribute("data-kleo-column-filter"))return;
      applyFilters(table);
      window.dispatchEvent(new CustomEvent("kleo:ui-audit",{detail:{event_type:"filter",route:window.location.pathname+window.location.search,target:"table-column-filter",label:target.getAttribute("aria-label")||"column filter",metadata:{column:Number(target.dataset.kleoColumnFilter||0)}}}));
    });
  }
  applyFilters(table);
}

export default function GlobalTableColumnFilters(){
  const{language}=useLanguage();
  useEffect(()=>{
    const placeholder=language==="en"?"Filter":"Szűrés";
    let queued=false;
    const scan=()=>{
      queued=false;
      document.querySelectorAll<HTMLTableElement>("table").forEach(table=>bindTable(table,placeholder));
    };
    const queueScan=()=>{
      if(queued)return;
      queued=true;
      queueMicrotask(scan);
    };
    scan();
    const observer=new MutationObserver(queueScan);
    observer.observe(document.body,{subtree:true,childList:true});
    return()=>observer.disconnect();
  },[language]);
  return null;
}

export { applyFilters, bindTable };
