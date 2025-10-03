<script lang="ts">
  import { onMount } from 'svelte';
  import { theme as externalTheme } from '$lib/stores/theme';

  export let fullWidth = false;

  let mode: 'light' | 'dark' = 'light';
  let cleanup: (() => void) | undefined;

  const root = typeof document !== 'undefined' ? document.documentElement : null;
  const readMode = () => (root?.classList.contains('dark') ? 'dark' : 'light');

  function apply(next: 'light' | 'dark') {
    if (!root) return;
    root.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('theme', next); } catch {}
  }

  function setExternal(next: 'light' | 'dark') {
    // Kalau store-mu writable, update juga biar integrasi tetap jalan.
    try { (externalTheme as any)?.set?.(next); } catch {}
  }

  onMount(() => {
    // Init dari localStorage / prefers-color-scheme / DOM
    let initial: 'light' | 'dark' = readMode();
    try {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (saved === 'light' || saved === 'dark') initial = saved;
      else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) initial = 'dark';
    } catch {}
    mode = initial;
    apply(mode);
    setExternal(mode);

    // Observe perubahan kelas <html> agar semua instance sinkron
    const obs = new MutationObserver(() => {
      const m = readMode();
      if (mode !== m) mode = m;
    });
    if (root) obs.observe(root, { attributes: true, attributeFilter: ['class'] });

    cleanup = () => obs.disconnect();
    return cleanup;
  });

  function toggle() {
    mode = mode === 'dark' ? 'light' : 'dark';
    apply(mode);
    setExternal(mode);
  }
</script>

<button
  on:click={toggle}
  class="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-black/5 dark:border-white/10
         hover:bg-black/5 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-slate-200 w-auto"
  class:w-full={fullWidth}
  class:justify-between={fullWidth}
  aria-label="Toggle theme"
>
  <div class="flex items-center gap-2">
    <svg class="h-4 w-4 block dark:hidden" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM4.84 17.24l-1.8 1.8 1.79 1.79 1.8-1.79-1.79-1.8zM20 11v2h3v-2h-3zm-1.76-6.16l1.79-1.79-1.41-1.41-1.8 1.79 1.42 1.41zM12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Z"/></svg>
    <svg class="h-4 w-4 hidden dark:block" viewBox="0 0 24 24" fill="currentColor"><path d="M20.742 13.045A8.5 8.5 0 0 1 10.955 3.258 9 9 0 1 0 20.742 13.045Z"/></svg>
    <span class="hidden sm:block">Theme</span>
  </div>
  <span class="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-900/5 dark:bg-white/5">
    {mode === 'dark' ? 'Dark' : 'Light'}
  </span>
</button>
