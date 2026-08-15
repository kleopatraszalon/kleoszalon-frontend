import api from "./api/api";

export type LoginResponse = {
  token: string;
  user?: { id: number | string; email: string; role: string | string[] };
  success?: boolean;
  role?: string | string[];
  account_type?: string;
  location_id?: string | number | null;
  location_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  login_name?: string | null;
};

/**
 * Canonical login helper. It intentionally uses the shared API client instead
 * of a relative fetch('/api/login'), because the admin UI is hosted on a
 * different Render origin than the API in production.
 */
export async function login(identifier: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/login", {
    identifier: identifier.trim(),
    password,
  });
  return response.data;
}
