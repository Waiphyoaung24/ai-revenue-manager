/**
 * Minimal auth helpers — token persistence in localStorage.
 *
 * The backend uses session-scoped JWTs:
 *   POST /api/v1/auth/login   → { access_token, token_type, expires_at }
 *   POST /api/v1/auth/session → { session_id, name, token: { access_token, ... } }
 *
 * We store the SESSION token (not the user token) because /optimize and
 * /chatbot require a session bearer token.
 */

const SESSION_KEY = "ri_session_token";
const USER_TOKEN_KEY = "ri_user_token";

// ── Storage helpers ───────────────────────────────────────────────────────────

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_KEY, token);
}

export function getUserToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_TOKEN_KEY);
}

export function setUserToken(token: string): void {
  localStorage.setItem(USER_TOKEN_KEY, token);
}

export function clearTokens(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getSessionToken());
}

// ── API calls ─────────────────────────────────────────────────────────────────

const BASE = "";

export interface LoginResult {
  access_token: string;
  token_type: string;
  expires_at: string;
}

export interface SessionResult {
  session_id: string;
  name: string;
  token: LoginResult;
}

export interface RegisterResult {
  id: number;
  email: string;
  token: LoginResult;
}

/**
 * Login with email + password. Returns the user access token.
 * After login, call `createSession` to get a session token.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  form.append("grant_type", "password");

  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? "Login failed");
  }

  const data: LoginResult = await res.json();
  setUserToken(data.access_token);
  return data;
}

/**
 * Register a new account. Returns user info + token.
 */
export async function register(email: string, password: string): Promise<RegisterResult> {
  const res = await fetch(`${BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? "Registration failed");
  }

  const data: RegisterResult = await res.json();
  setUserToken(data.token.access_token);
  return data;
}

/**
 * Create a new chat session using the user token.
 * Stores the returned session token in localStorage.
 */
export async function createSession(userToken: string): Promise<SessionResult> {
  const res = await fetch(`${BASE}/api/v1/auth/session`, {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? "Session creation failed");
  }

  const data: SessionResult = await res.json();
  setSessionToken(data.token.access_token);
  return data;
}

/**
 * Login + auto-create a session in one step.
 * Stores both tokens. Returns the session result.
 */
export async function loginAndCreateSession(
  email: string,
  password: string
): Promise<SessionResult> {
  const loginRes = await login(email, password);
  return createSession(loginRes.access_token);
}
