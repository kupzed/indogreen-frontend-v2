<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { loginApi, setToken } from '$lib/api';
  import ThemeToggle from '$lib/components/layout/ThemeToggle.svelte';

  let email = '';
  let password = '';
  let showPassword = false;
  let loading = false;
  let errorMessage: string | null = null;

  let redirectTo = '/dashboard';

  $: {
    const redirectParam = $page.url.searchParams.get('redirect');

    if (
      redirectParam &&
      redirectParam.startsWith('/') &&
      !redirectParam.startsWith('/auth')
    ) {
      redirectTo = redirectParam;
    } else {
      redirectTo = '/dashboard';
    }
  }

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    errorMessage = null;
    loading = true;

    try {
      const res = await loginApi({ email, password });
      const token = res?.access_token || res?.token;
      if (!token) throw new Error('Token tidak ditemukan');

      setToken(token);

      await goto(redirectTo, {
        replaceState: true
      });
    } catch (err: any) {
      if (err?.message === 'AUTH_REDIRECT') {
        return;
      }
      errorMessage = err?.message || 'Login gagal';
    } finally {
      loading = false;
    }
  }

  $: type = showPassword ? 'text' : 'password';
  $: disabled = loading;
</script>

<div class="space-y-8">
  <div>
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Sign in</h2>
      <ThemeToggle />
    </div>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
      Welcome back! Please enter your details.
    </p>
  </div>

  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-200/60 dark:border-red-500/30 bg-red-50/70 dark:bg-red-900/20 text-red-700 dark:text-red-200 px-4 py-3 text-sm">
      {errorMessage}
    </div>
  {/if}

  <form method="post" on:submit={onSubmit} class="space-y-5">
    <div class="space-y-2">
      <label for="email" class="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        required
        placeholder="you@example.com"
        class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2.5
              text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4
              focus:ring-violet-500/20 dark:focus:ring-violet-600/25" />
    </div>

    <div class="space-y-2">
      <label for="password" class="text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
      <div class="relative">
        <input
          id="password"
          {type}
          bind:value={password}
          required
          minlength="6"
          placeholder="••••••••"
          class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2.5
                text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4
                focus:ring-violet-500/20 dark:focus:ring-violet-600/25 pr-10" />
        <button
          type="button"
          on:click={() => (showPassword = !showPassword)}
          class="absolute inset-y-0 right-0 grid place-items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          {#if showPassword}
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M2.81 2.81 1.39 4.22l3.2 3.2A12.4 12.4 0 0 0 1 12s4 7 11 7a11.3 11.3 0 0 0 5.34-1.38l3.44 3.44 1.41-1.41L2.81 2.81Zm9.19 14.19A5 5 0 0 1 7.8 9.81l1.53 1.53a3 3 0 0 0 3.33 3.33l1.53 1.53a4.93 4.93 0 0 1-1.62.8ZM12 5c7 0 11 7 11 7a16.1 16.1 0 0 1-3.09 4.12l-1.44-1.44A12.5 12.5 0 0 0 21 12s-4-7-9-7a10.6 10.6 0 0 0-4 .77l1.56 1.56A8.5 8.5 0 0 1 12 5Z" />
            </svg>
          {:else}
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 5c7 0 11 7 11 7s-4 7-11 7S1 12 1 12 5 5 12 5Zm0 2C7 7 3.73 11.11 2.7 12 3.72 12.9 7 17 12 17s8.28-4.1 9.3-5c-1.02-.9-4.3-5-9.3-5Zm0 3a4 4 0 1 1-4 4 4 4 0 0 1 4-4Z" />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    <button
      type="submit"
      {disabled}
      class="w-full rounded-xl bg-violet-600 text-white font-semibold px-4 py-2.5 transition
            hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed">
      {#if loading}
        <span class="inline-flex items-center gap-2">
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity=".25" stroke-width="4" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4" />
          </svg>
          Signing in...
        </span>
      {:else}
        Sign in
      {/if}
    </button>

    <p class="text-center text-sm text-slate-600 dark:text-slate-400">
      Don’t have an account?
      <a href="/auth/register" class="font-medium text-violet-700 dark:text-violet-300 hover:underline">
        Create one
      </a>
    </p>
  </form>
</div>
