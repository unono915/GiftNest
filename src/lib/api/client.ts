import { getFirebaseAuth } from "@/lib/firebase/client";

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * fetch() wrapper that attaches the current device's Firebase ID token.
 * Every write in the app goes through a server API route (see architecture
 * notes in the planning doc), so this is the one place that needs to know
 * how auth headers are shaped.
 */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new ApiClientError(401, "로그인이 필요합니다.");

  const idToken = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${idToken}`);
  // FormData bodies must NOT get an explicit Content-Type — the browser
  // sets its own `multipart/form-data; boundary=...`, and overriding it
  // (even with the "right" mime type) breaks the server's form parser.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(path, { ...init, headers });
}

export async function authedJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await authedFetch(path, init);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new ApiClientError(response.status, data?.error ?? "요청을 처리하지 못했습니다.");
  }
  return data as T;
}
