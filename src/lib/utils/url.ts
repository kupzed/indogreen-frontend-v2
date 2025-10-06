// src/lib/utils/url.ts
import { STORAGE_BASE_URL } from '$lib/config';

// Ambil host backend tanpa suffix /api
const BACKEND_HOST = STORAGE_BASE_URL.replace(/\/api\/?$/, '');

export function storageUrl(path: string | null | undefined) {
	if (!path) return '';
	// Kalau backend sudah mengembalikan URL absolut, pakai apa adanya
	if (/^https?:\/\//i.test(path)) return path;
	// Normal case: path = 'attachments/...'
	return `${BACKEND_HOST}/${path.replace(/^\/+/, '')}`;
}
