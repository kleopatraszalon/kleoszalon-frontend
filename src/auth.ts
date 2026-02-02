// src/api/auth.ts
export type LoginResponse = { token: string; user: { id: number; email: string; role: string } };

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch('/api/login', {            // ⬅️ proxy miatt elég a relatív útvonal
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  // 401: hibás adatok, 404: rossz útvonal, stb.
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Login failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}