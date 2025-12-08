<script lang="ts">
  import '../../app.css';
  import { goto } from '$app/navigation';
  import { getToken } from '$lib/api';
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores/theme';
  import AppNavbar from '$lib/components/layout/AppNavbar.svelte';
  import { apiFetch } from '$lib/api';
  import { setPermissions, setRoles } from '$lib/stores/permissions';
  import { setUser } from '$lib/stores/user'; // optional

  let { children } = $props();

  onMount(() => {
    const unsub = theme.subscribe(() => {});

    // auth redirect if no token
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
      } else {
        // fetch roles & permissions (and optionally user data)
        (async () => {
          try {
            // endpoint harus mengembalikan { roles:[], permissions:[], ... }
            const resp: any = await apiFetch('/auth/role/me', { method: 'GET', auth: true });
            setRoles(resp.roles ?? []);
            setPermissions(resp.permissions ?? []);
          } catch (err) {
            // jika token expired apiFetch dengan auth:true otomatis redirect ke login
            console.warn('Failed to load roles/permissions', err);
          }
          // juga bisa fetch /auth/me untuk info user, jika diperlukan
          try {
            const me: any = await apiFetch('/auth/me', { method: 'POST', auth: true });
            if (me?.name || me?.email) setUser({ name: me.name ?? '', email: me.email ?? '' });
          } catch (e) {}
        })();
      }
    }

    return unsub;
  });
</script>

<div class="min-h-screen bg-gradient-to-b from-violet-50 to-violet-50 dark:from-[#0b0317] dark:to-[#0b0317]">
  <AppNavbar />

  <main class="px-4 sm:px-6 lg:px-8 py-6">
    {@render children?.()}
  </main>
</div>
