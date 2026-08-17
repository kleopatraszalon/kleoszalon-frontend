export type ColumnFilterKind = "text" | "number-min" | "number-max" | "select" | "boolean";

export type ColumnFilter<Row> = {
  id: string;
  kind: ColumnFilterKind;
  value: string;
  getValue: (row: Row) => unknown;
};

function normalizedText(value: unknown, locale = "hu-HU") {
  return String(value ?? "").toLocaleLowerCase(locale);
}

export function applyColumnFilters<Row>(rows: Row[], filters: ColumnFilter<Row>[], locale = "hu-HU"): Row[] {
  const active = filters.filter(filter => filter.value !== "");
  if (!active.length) return rows;
  return rows.filter(row => active.every(filter => {
    const raw = filter.getValue(row);
    if (filter.kind === "text") return normalizedText(raw, locale).includes(normalizedText(filter.value, locale).trim());
    if (filter.kind === "select") return String(raw ?? "") === filter.value;
    if (filter.kind === "boolean") return String(Boolean(raw)) === filter.value;
    const actual = Number(raw ?? 0);
    const expected = Number(filter.value);
    if (!Number.isFinite(expected)) return true;
    if (filter.kind === "number-min") return actual >= expected;
    if (filter.kind === "number-max") return actual <= expected;
    return true;
  }));
}
