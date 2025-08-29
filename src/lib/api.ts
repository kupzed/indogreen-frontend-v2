// Simple API helper for calling the Laravel backend
// - Reads base URL from PUBLIC_API_BASE or VITE_API_BASE, with a sensible local default
// - Manages JWT storage in localStorage

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const DEFAULT_API_BASE = 'http://127.0.0.1:8000/api';

export const API_BASE: string =
	(import.meta as any).env?.PUBLIC_API_BASE ||
	(import.meta as any).env?.VITE_API_BASE ||
	DEFAULT_API_BASE;

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
	if (typeof localStorage === 'undefined') return;
	if (!token) {
		localStorage.removeItem(TOKEN_KEY);
	} else {
		localStorage.setItem(TOKEN_KEY, token);
	}
}

export async function apiFetch<T = any>(
	path: string,
	options: {
		method?: HttpMethod;
		body?: any;
		headers?: Record<string, string>;
		auth?: boolean;
	} = {}
): Promise<T> {
	const { method = 'GET', body, headers = {}, auth = false } = options;

	const url = path.startsWith('http')
		? path
		: `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

	const finalHeaders: Record<string, string> = {
		Accept: 'application/json',
		...headers
	};

	if (body && !(body instanceof FormData)) {
		finalHeaders['Content-Type'] = 'application/json';
	}

	if (auth) {
		const token = getToken();
		if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(url, {
		method,
		headers: finalHeaders,
		body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
	});

	if (!response.ok) {
		let errorBody: any = null;
		try {
			errorBody = await response.json();
		} catch {
			// ignore
		}
		const message = errorBody?.message || `Request failed (${response.status})`;
		throw new Error(message);
	}

	// Try to parse JSON; fallback to text
	const contentType = response.headers.get('content-type') || '';
	if (contentType.includes('application/json')) {
		return (await response.json()) as T;
	}
	return (await response.text()) as unknown as T;
}

export async function loginApi(payload: {
	email: string;
	password: string;
}): Promise<{ token: string } | any> {
	return apiFetch('/auth/login', { method: 'POST', body: payload });
}

export async function registerApi(payload: {
	name: string;
	email: string;
	password: string;
	password_confirmation: string;
}): Promise<any> {
	return apiFetch('/auth/register', { method: 'POST', body: payload });
}

export async function fetchDashboard(): Promise<any> {
	return apiFetch('/dashboard', { auth: true });
}
