<script lang="ts">
  import '../../../app.css';
  import { goto } from '$app/navigation';
  import { getToken } from '$lib/api';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(() => {
    if (typeof window === 'undefined') return;

    const token = getToken();
    if (!token) return;

    const redirectParam = new URL(window.location.href).searchParams.get('redirect');

    const target =
      redirectParam &&
      redirectParam.startsWith('/') &&
      !redirectParam.startsWith('/auth')
        ? redirectParam
        : '/dashboard';

    goto(target, { replaceState: true });
  });
</script>

<div class="min-h-[100svh] grid place-items-center bg-gradient-to-br from-violet-50 to-slate-50 dark:from-[#0b0617] dark:to-[#0b0617] px-4 py-8">
  <div class="w-full max-w-5xl overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur shadow-xl">
    <div class="grid md:grid-cols-2">

      <!-- Brand / Visual panel -->
      <div class="relative hidden md:flex flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 text-white">
        <div>
          <div class="flex items-center gap-2 text-white/90">
            <span class="text-sm/none uppercase tracking-widest">Welcome</span>
          </div>
          <h1 class="mt-4 text-3xl font-extrabold tracking-tight">INDOGREEN</h1>
          <p class="mt-2 text-white/80">Sign in or create your account to continue.</p>
        </div>

        <ul class="mt-8 space-y-3 text-white/90">
          <li class="flex items-start gap-3">
            <svg class="mt-1 h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Secure & modern authentication</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="mt-1 h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Dark / light theme support</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="mt-1 h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Responsive & accessible UI</span>
          </li>
        </ul>

        <div class="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white/20 blur-3xl"></div>
      </div>

      <!-- Form slot -->
      <div class="p-6 sm:p-8 lg:p-10 bg-white/80 dark:bg-[#0e0c19]/60">
        <div class="mx-auto w-full max-w-md">
          {@render children?.()}
        </div>
      </div>
    </div>
  </div>
</div>
