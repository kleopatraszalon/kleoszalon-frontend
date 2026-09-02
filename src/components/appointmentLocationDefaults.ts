export function storedAppointmentLocationId(): string {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem("kleo_location_id") || "").trim();
  } catch {
    return "";
  }
}

export function resolveAppointmentLocationId(
  storedLocationId: string,
  locations: Array<{ id?: string | null }>,
): string {
  const stored = String(storedLocationId || "").trim();
  if (stored && locations.some((location) => String(location?.id || "") === stored)) return stored;
  return String(locations[0]?.id || "");
}
