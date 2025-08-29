<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
  import { goto } from '$app/navigation';
  import { getToken } from '$lib/api';

  // Minimal route guard: redirect unauthenticated users away from /dashboard
  if (typeof window !== 'undefined') {
    const isDashboard = window.location.pathname.startsWith('/dashboard');
    const token = getToken();
    if (isDashboard && !token) {
      goto('/auth/login');
    }
  }

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- <div>
  <h1>Layout</h1>
</div> -->
{@render children?.()}
