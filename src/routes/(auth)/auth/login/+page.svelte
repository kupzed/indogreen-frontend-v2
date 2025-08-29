<script lang="ts">
  import { goto } from '$app/navigation';
  import { loginApi, setToken } from '$lib/api';

  let email = '';
  let password = '';
  let loading = false;
  let errorMessage: string | null = null;

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    errorMessage = null;
    loading = true;
    try {
      const res = await loginApi({ email, password });
      // Backend may return { access_token } or { token }
      const token = res?.access_token || res?.token;
      if (!token) throw new Error('Token tidak ditemukan');
      setToken(token);
      goto('/dashboard');
    } catch (err: any) {
      errorMessage = err?.message || 'Login gagal';
    } finally {
      loading = false;
    }
  }
</script>

<form method="post" on:submit={onSubmit} style="display:flex;flex-direction:column;gap:12px;">
  {#if errorMessage}
    <div style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;border-radius:8px;padding:10px 12px;font-size:13px;">{errorMessage}</div>
  {/if}

  <div style="display:flex;flex-direction:column;gap:6px;">
    <label for="email" style="font-size:13px;color:#2d3748;">Email</label>
    <input id="email" type="email" bind:value={email} required placeholder="you@example.com" style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;outline:none;" />
  </div>

  <div style="display:flex;flex-direction:column;gap:6px;">
    <label for="password" style="font-size:13px;color:#2d3748;">Password</label>
    <input id="password" type="password" bind:value={password} required placeholder="••••••••" style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;outline:none;" />
  </div>

  <button type="submit" disabled={loading} style="margin-top:6px;padding:10px 12px;border:none;border-radius:8px;background:#2563eb;color:white;font-weight:600;cursor:pointer;">
    {#if loading}Masuk...{/if}
    {#if !loading}Masuk{/if}
  </button>

  <p style="margin:6px 0 0;color:#4a5568;font-size:13px;">Belum punya akun? <a href="/auth/register" style="color:#2563eb;">Daftar</a></p>
</form>


