import { writable } from 'svelte/store';

export type User = {
	id?: number;
	name: string;
	email: string;
};

export const currentUser = writable<User | null>(null);

// helper opsional biar rapih dipakai di mana-mana
export const setUser = (u: User | null) => currentUser.set(u);
export const patchUser = (partial: Partial<User>) =>
	currentUser.update((u) => (u ? { ...u, ...partial } : u));
