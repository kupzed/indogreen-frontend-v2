// Simple API helper for calling the Laravel backend
// - Reads base URL from PUBLIC_API_BASE or VITE_API_BASE, with a sensible local default
// - Manages JWT storage in localStorage
import { env as publicEnv } from '$env/dynamic/public';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const DEFAULT_API_BASE = 'http://localhost:8000/api';

export const API_BASE: string =
	publicEnv.PUBLIC_API_BASE_URL ??
	import.meta.env.PUBLIC_API_BASE_URL ??
	import.meta.env.VITE_API_BASE_URL ??
	DEFAULT_API_BASE;

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

function isJsonCT(ct: string | null): boolean {
	return !!ct && ct.includes('application/json');
}

function isUnauthorized(status: number, payload: unknown): boolean {
	if (status === 401 || status === 419) return true;
	const msg = extractMessage(payload)?.toLowerCase() ?? '';
	return msg.includes('unauthenticated');
}

async function redirectToLogin() {
	if (typeof window === 'undefined') return;

	const current = window.location.pathname + window.location.search + window.location.hash;

	const loginUrl = `/auth/login?redirect=${encodeURIComponent(current)}`;

	try {
		const nav = await import('$app/navigation');
		nav.goto(loginUrl, { replaceState: true });
		return;
	} catch {
		window.location.href = loginUrl;
	}
}

/**
 * Fetch wrapper with JSON support and optional auth.
 * - Injects Authorization when options.auth = true
 * - Parses JSON otomatis
 * - Jika 401/419 atau pesan "Unauthenticated": clear token + redirect ke /auth/login
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

	// Parse payload terlebih dahulu agar bisa mendeteksi unauthorized
	let payload: unknown = null;
	try {
		const ct = response.headers.get('content-type');
		payload = isJsonCT(ct) ? await response.json() : await response.text();
	} catch {
		// ignore parse errors
	}

	if (!response.ok) {
		// HANYA redirect kalau request ini memang pakai auth: true
		if (auth && isUnauthorized(response.status, payload)) {
			try {
				setToken(null);
			} catch (err: unknown) {
				console.error('Failed to clear token:', err);
			}
			await redirectToLogin();
			// lempar error khusus supaya UI tidak menampilkan pesan "Unauthenticated"
			throw new Error('AUTH_REDIRECT');
		}

		// Untuk request tanpa auth (termasuk /auth/login), cukup lempar pesan error dari API
		const message =
			extractMessage(payload) ||
			(typeof payload === 'string' && payload.trim().length > 0
				? payload
				: `Email atau password salah! [Request failed (${response.status})]`);

		throw new Error(message);
	}

	// Sukses
	const ct = response.headers.get('content-type') || '';
	if (ct.includes('application/json')) {
		// jika sebelumnya sudah di-parse (payload), gunakan itu saja
		return (payload as T) ?? ((await response.json()) as T);
	}
	return (typeof payload === 'string' ? payload : await response.text()) as unknown as T;
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
