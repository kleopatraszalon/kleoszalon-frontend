export function getKpiColor(value: number, target: number, reverse = false) {
  if (!target) return "#64748b";

  const ratio = value / target;

  if (reverse) {
    if (value <= target) return "#16a34a";
    if (value <= target * 1.2) return "#f59e0b";
    return "#dc2626";
  }

  if (ratio >= 1) return "#16a34a";
  if (ratio >= 0.8) return "#f59e0b";
  return "#dc2626";
}
