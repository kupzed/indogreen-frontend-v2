import { writable, derived } from 'svelte/store';

export const userPermissions = writable<string[]>([]);
export const userRoles = writable<string[]>([]);

export function setPermissions(perms: string[] | null) {
	userPermissions.set(perms ?? []);
}
export function setRoles(roles: string[] | null) {
	userRoles.set(roles ?? []);
}

// helper convenience
export const hasPermission = (perm: string) => derived(userPermissions, ($p) => $p.includes(perm));
