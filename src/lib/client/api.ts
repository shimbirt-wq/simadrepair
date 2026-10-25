export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; code?: string; details?: Record<string, unknown>; issues: Record<string, string[] | undefined> };

/** fetch + JSON for client components; never throws for HTTP errors. */
export async function sendJson<T>(url: string, method: "POST" | "PATCH" | "DELETE" | "GET" = "POST", body?: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | (T & { error?: string; code?: string; details?: Record<string, unknown> & { issues?: Record<string, string[]> }; issues?: Record<string, string[]> })
      | null;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: payload?.error ?? "Something went wrong. Try again.",
        code: payload?.code,
        details: payload?.details,
        issues: payload?.issues ?? payload?.details?.issues ?? {},
      };
    }
    return { ok: true, data: payload as T };
  } catch {
    return { ok: false, status: 0, error: "No connection. Check your internet and try again.", issues: {} };
  }
}

export function firstIssue(issues: Record<string, string[] | undefined>, field: string) {
  return issues[field]?.[0] ?? null;
}
