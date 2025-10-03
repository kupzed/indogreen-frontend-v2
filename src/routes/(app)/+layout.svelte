<script lang="ts">
  import '../../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { goto } from '$app/navigation';
  import { getToken } from '$lib/api';
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores/theme';
  import AppNavbar from '$lib/components/layout/AppNavbar.svelte';

  onMount(() => {
    const unsub = theme.subscribe(() => {});
    return unsub;
  });

  // Minimal route guard: redirect unauthenticated users away from /dashboard
  if (typeof window !== 'undefined') {
    const isDashboard = window.location.pathname.startsWith('/dashboard');
    const token = getToken();
    if (isDashboard && !token) goto('/auth/login');
  }

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<!-- App shell background -->
<div class="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-[#0b0617] dark:to-[#0b0617]">
  <AppNavbar />

  <!-- Page container -->
  <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
    {@render children?.()}
  </main>
</div>
