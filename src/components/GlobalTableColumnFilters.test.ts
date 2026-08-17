import{applyFilters,bindTable}from"./GlobalTableColumnFilters";

describe("global mandatory column filters",()=>{
 beforeEach(()=>{document.body.innerHTML=""});
 test("injects one filter per column and combines filters with AND",()=>{
  document.body.innerHTML=`<table><thead><tr><th>Név</th><th>Telephely</th></tr></thead><tbody><tr><td>Anna</td><td>Buda</td></tr><tr><td>Anna</td><td>Pest</td></tr><tr><td>Béla</td><td>Buda</td></tr></tbody></table>`;
  const table=document.querySelector("table") as HTMLTableElement;
  bindTable(table,"Szűrés");
  const inputs=table.querySelectorAll<HTMLInputElement>("input[data-kleo-column-filter]");
  expect(inputs).toHaveLength(2);
  inputs[0].value="anna";inputs[1].value="buda";applyFilters(table);
  const rows=Array.from(table.tBodies[0].rows);
  expect(rows.map(r=>r.hidden)).toEqual([false,true,true]);
 });
 test("does not duplicate the generated filter row",()=>{
  document.body.innerHTML=`<table><thead><tr><th>Név</th></tr></thead><tbody><tr><td>Anna</td></tr></tbody></table>`;
  const table=document.querySelector("table") as HTMLTableElement;
  bindTable(table,"Szűrés");bindTable(table,"Filter");
  expect(table.querySelectorAll("tr[data-kleo-column-filters]")).toHaveLength(1);
  expect(table.querySelector("input")?.getAttribute("placeholder")).toBe("Filter");
 });
});
