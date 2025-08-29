<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToken } from '$lib/api';
  import { onMount } from 'svelte';

  onMount(() => {
    const token = getToken();
    if (token) {
      goto('/dashboard');
    } else {
      goto('/auth/login');
    }
  });
</script>

