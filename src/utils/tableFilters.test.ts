import { applyColumnFilters } from "./tableFilters";

type Row = { name: string; location: string; wage: number; active: boolean };
const rows: Row[] = [
  { name: "Kovács Anna", location: "Buda", wage: 420000, active: true },
  { name: "Kovács Béla", location: "Pest", wage: 520000, active: true },
  { name: "Nagy Éva", location: "Buda", wage: 380000, active: false },
];

test("KLEO-GEN-FLTR-001-AC-01 supports type-appropriate column predicates", () => {
  expect(applyColumnFilters(rows, [{ id: "wage", kind: "number-min", value: "500000", getValue: row => row.wage }])).toEqual([rows[1]]);
  expect(applyColumnFilters(rows, [{ id: "active", kind: "boolean", value: "false", getValue: row => row.active }])).toEqual([rows[2]]);
});

test("KLEO-GEN-FLTR-001-AC-02 combines active column filters with AND and the result count equals filtered rows", () => {
  const filtered = applyColumnFilters(rows, [
    { id: "name", kind: "text", value: "kovács", getValue: row => row.name },
    { id: "location", kind: "select", value: "Buda", getValue: row => row.location },
  ]);
  expect(filtered).toEqual([rows[0]]);
  expect(filtered).toHaveLength(1);
});
