import { writable, get } from 'svelte/store';

export type Theme = 'light' | 'dark';

// Apakah user sudah memilih sendiri (explicit) atau masih ikut sistem?
let explicitPref = false;

function createThemeStore() {
	// Tentukan tema awal
	let initial: Theme = 'light';
	let prefersDark: MediaQueryList | null = null;

	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('theme'); // 'light' | 'dark' | null
		explicitPref = stored === 'light' || stored === 'dark';

		prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
		initial = (stored as Theme) ?? (prefersDark.matches ? 'dark' : 'light');
	}

	const store = writable<Theme>(initial);

	// Sinkronkan kelas <html> dan (hanya jika explicit) simpan ke localStorage
	store.subscribe((value) => {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', value === 'dark');
		}
		if (typeof localStorage !== 'undefined' && explicitPref) {
			localStorage.setItem('theme', value);
		}
	});

	// Jika belum ada preferensi explicit, ikuti perubahan sistem secara live
	if (typeof window !== 'undefined' && prefersDark && !explicitPref) {
		const listener = (e: MediaQueryListEvent) => {
			store.set(e.matches ? 'dark' : 'light');
		};
		try {
			prefersDark.addEventListener('change', listener);
		} catch {
			// Safari lama
			prefersDark.addListener(listener);
		}
	}

	function setThemeExplicit(value: Theme) {
		explicitPref = true;
		store.set(value);
	}

	function toggleTheme() {
		setThemeExplicit(get(store) === 'dark' ? 'light' : 'dark');
	}

	// Opsional: panggil ini kalau mau kembali mengikuti sistem (hapus preferensi explicit)
	function useSystemTheme() {
		explicitPref = false;
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('theme');
		}
		if (typeof window !== 'undefined') {
			const mql = window.matchMedia('(prefers-color-scheme: dark)');
			store.set(mql.matches ? 'dark' : 'light');
		} else {
			store.set('light');
		}
	}

	return {
		subscribe: store.subscribe,
		toggleTheme,
		setThemeExplicit,
		useSystemTheme
	};
}

const _theme = createThemeStore();

// Ekspor agar tetap kompatibel dengan import lama di komponen
export const theme = { subscribe: _theme.subscribe };
export const toggleTheme = _theme.toggleTheme;
export const setThemeExplicit = _theme.setThemeExplicit;
export const useSystemTheme = _theme.useSystemTheme;
