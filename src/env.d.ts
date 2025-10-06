/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly PUBLIC_API_BASE?: string;
	readonly VITE_API_BASE?: string;
}
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
