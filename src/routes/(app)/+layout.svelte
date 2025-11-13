<script lang="ts">
  import '../../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { goto } from '$app/navigation';
  import { getToken } from '$lib/api';
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores/theme';
  import AppNavbar from '$lib/components/layout/AppNavbar.svelte';

  let { children } = $props();

  onMount(() => {
    const unsub = theme.subscribe(() => {});

    if (typeof window !== 'undefined') {
      const token = getToken();
      if (!token) {
        const current =
          window.location.pathname +
          window.location.search +
          window.location.hash;

        goto(`/auth/login?redirect=${encodeURIComponent(current)}`, {
          replaceState: true
        });
      }
    }

    return unsub;
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-violet-50 to-violet-50 dark:from-[#0b0317] dark:to-[#0b0317]">
  <AppNavbar />

  <main class="px-4 sm:px-6 lg:px-8 py-6">
    {@render children?.()}
  </main>
</div>
