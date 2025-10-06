// Simple API helper for calling the Laravel backend
// - Reads base URL from PUBLIC_API_BASE or VITE_API_BASE, with a sensible local default
// - Manages JWT storage in localStorage

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const DEFAULT_API_BASE = 'http://192.168.1.44:8001/api';

export const API_BASE: string =
	import.meta.env.PUBLIC_API_BASE ?? import.meta.env.VITE_API_BASE ?? DEFAULT_API_BASE;

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
	if (typeof localStorage === 'undefined') return;
	if (!token) localStorage.removeItem(TOKEN_KEY);
	else localStorage.setItem(TOKEN_KEY, token);
}

/** JSON helpers */
type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | { [k: string]: JsonValue } | JsonValue[];
type JsonObject = { [k: string]: JsonValue };

/** Allowed request bodies */
type ApiBody = JsonObject | FormData | BodyInit | undefined;

/** Common options for apiFetch */
export interface ApiFetchOptions {
	method?: HttpMethod;
	body?: ApiBody;
	headers?: Record<string, string>;
	auth?: boolean;
}

/** Try to read "message" safely from an unknown error payload */
function extractMessage(u: unknown): string | undefined {
	if (typeof u === 'object' && u !== null) {
		const maybe = (u as { message?: unknown }).message;
		if (typeof maybe === 'string') return maybe;
	}
	return undefined;
}

/**
 * Fetch wrapper with JSON support and optional auth.
 * T is the expected response type; defaults to unknown.
 */
export async function apiFetch<T = unknown>(
	path: string,
	options: ApiFetchOptions = {}
): Promise<T> {
	const { method = 'GET', body, headers = {}, auth = false } = options;

	const url = path.startsWith('http')
		? path
		: `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

	const finalHeaders: Record<string, string> = {
		Accept: 'application/json',
		...headers
	};

	// Add JSON content-type if we send a plain object (not FormData / raw BodyInit)
	const isJsonObject =
		body !== undefined &&
		!(body instanceof FormData) &&
		typeof body === 'object' &&
		!(body instanceof ArrayBuffer) &&
		!(body instanceof Blob) &&
		!(body instanceof ReadableStream);

	if (isJsonObject) {
		finalHeaders['Content-Type'] = 'application/json';
	}

	if (auth) {
		const token = getToken();
		if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
	}

	const fetchBody: BodyInit | undefined =
		body === undefined
			? undefined
			: body instanceof FormData
				? body
				: isJsonObject
					? JSON.stringify(body)
					: (body as BodyInit);

	const response = await fetch(url, {
		method,
		headers: finalHeaders,
		body: fetchBody
	});

	if (!response.ok) {
		let errorBody: unknown = null;
		try {
			const ct = response.headers.get('content-type') ?? '';
			errorBody = ct.includes('application/json') ? await response.json() : await response.text();
		} catch {
			// ignore parse error
		}
		const message = extractMessage(errorBody) ?? `Request failed (${response.status})`;
		throw new Error(message);
	}

	// Try to parse JSON; fallback to text cast to unknown
	const contentType = response.headers.get('content-type') || '';
	if (contentType.includes('application/json')) {
		return (await response.json()) as T;
	}
	return (await response.text()) as unknown as T;
}

/** Auth endpoints types */
export interface LoginPayload extends JsonObject {
	email: string;
	password: string;
}
export interface LoginResponse {
	access_token?: string;
	token?: string;
	[k: string]: unknown;
}

export interface RegisterPayload extends JsonObject {
	name: string;
	email: string;
	password: string;
	password_confirmation: string;
}
export interface RegisterResponse {
	message?: string;
	[k: string]: unknown;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
	return apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: payload });
}

export async function registerApi(payload: RegisterPayload): Promise<RegisterResponse> {
	return apiFetch<RegisterResponse>('/auth/register', { method: 'POST', body: payload });
}

export type DashboardResponse = unknown; // define a concrete type if backend contract available
export async function fetchDashboard(): Promise<DashboardResponse> {
	return apiFetch<DashboardResponse>('/dashboard', { auth: true });
}
