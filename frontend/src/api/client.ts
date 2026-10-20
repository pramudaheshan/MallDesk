
const API_BASE = "/api";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCsrfToken(): Promise<string> {
  const response = await fetch("/api/auth/csrf/", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Could not obtain CSRF token.");
  }

  const data = await response.json();
  return data.csrfToken;
}