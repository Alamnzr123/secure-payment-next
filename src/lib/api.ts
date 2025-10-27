export type ApiResponse<T = object> = { data?: T; error?: string; message?: string; fieldErrors?: Record<string, string> };

export async function apiFetch<T = object>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const url = path.startsWith("/api") ? path : `/api/${path.replace(/^\/+/, "")}`;
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const json = await res.json();
    if (!res.ok) return { error: json?.message || res.statusText, fieldErrors: json?.fieldErrors };
    return { data: json as T };
  }

  if (!res.ok) return { error: res.statusText };
  return { data: undefined as unknown as T };
}

// Auth helpers (uses /api/auth)
export async function login(email: string, password: string) {
  return apiFetch<{ user: { id: string; email: string; role?: string } }>("auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, role = "FINANCE_MANAGER") {
  return apiFetch<{ user: { id: string; email: string; role?: string } }>("register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
}

export async function getCurrentUser() {
  return apiFetch<{ user: { id: string; email: string; role?: string } }>("auth", {
    method: "GET",
  });
}

export async function logout() {
  return apiFetch("auth/logout", { method: "POST" });
}

export async function generatePaymentLink(invoiceId: string, expiresHours = 72) {
  return apiFetch<{ token: string; url: string; expiresAt: string }>("payment-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId, expiresHours }),
  });
}

export async function fetchInvoiceByToken(token: string) {
  const res = await fetch(`/api/payment-links/${encodeURIComponent(token)}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const json = await res.json();
    if (!res.ok) return { error: json?.message || res.statusText };
    return { data: json };
  }
  if (!res.ok) return { error: res.statusText };
  return { data: undefined as unknown };
}