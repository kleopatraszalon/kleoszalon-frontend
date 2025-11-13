// src/utils/api.ts

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`API hiba: ${res.status} ${res.statusText}`);
  }

  return res.json();
}