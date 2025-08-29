<script lang="ts">
  import { goto } from '$app/navigation';
  import { registerApi } from '$lib/api';

  let name = '';
  let email = '';
  let password = '';
  let passwordConfirmation = '';
  let loading = false;
  let errorMessage: string | null = null;
  let successMessage: string | null = null;

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (password !== passwordConfirmation) {
      errorMessage = 'Konfirmasi password tidak cocok';
      return;
    }

    errorMessage = null;
    successMessage = null;
    loading = true;
    
    try {
      await registerApi({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation
      });
      
      successMessage = 'Pendaftaran berhasil! Silakan login dengan akun Anda.';
      // Clear form
      name = '';
      email = '';
      password = '';
      passwordConfirmation = '';
      
      // Auto redirect to login after 2 seconds
      setTimeout(() => {
        goto('/auth/login');
      }, 2000);
      
    } catch (err: any) {
      errorMessage = err?.message || 'Pendaftaran gagal. Silakan coba lagi.';
    } finally {
      loading = false;
    }
  }
</script>

<div>
  
  <form method="post" on:submit={onSubmit} style="display:flex;flex-direction:column;gap:12px;">
    {#if errorMessage}
      <div style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;border-radius:8px;padding:10px 12px;font-size:13px;">
        {errorMessage}
      </div>
    {/if}
    
    {#if successMessage}
      <div style="background:#f0fff4;color:#2f855a;border:1px solid #c6f6d5;border-radius:8px;padding:10px 12px;font-size:13px;">
        {successMessage}
      </div>
    {/if}

    <div style="display:flex;flex-direction:column;gap:6px;">
      <label for="name" style="font-size:13px;color:#2d3748;">Nama Lengkap</label>
      <input 
        id="name" 
        type="text" 
        bind:value={name} 
        required 
        placeholder="Nama lengkap" 
        style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;outline:none;" 
      />
    </div>

    <div style="display:flex;flex-direction:column;gap:6px;">
      <label for="email" style="font-size:13px;color:#2d3748;">Email</label>
      <input 
        id="email" 
        type="email" 
        bind:value={email} 
        required 
        placeholder="you@example.com" 
        style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;outline:none;" 
      />
    </div>

    <div style="display:flex;flex-direction:column;gap:6px;">
      <label for="password" style="font-size:13px;color:#2d3748;">Password</label>
      <input 
        id="password" 
        type="password" 
        bind:value={password} 
        required 
        minlength="8"
        placeholder="••••••••" 
        style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;outline:none;" 
      />
    </div>

    <div style="display:flex;flex-direction:column;gap:6px;">
      <label for="passwordConfirmation" style="font-size:13px;color:#2d3748;">Konfirmasi Password</label>
      <input 
        id="passwordConfirmation" 
        type="password" 
        bind:value={passwordConfirmation} 
        required 
        minlength="8"
        placeholder="••••••••" 
        style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;outline:none;" 
      />
    </div>

    <button 
      type="submit" 
      disabled={loading} 
      style="margin-top:6px;padding:10px 12px;border:none;border-radius:8px;background:#2563eb;color:white;font-weight:600;cursor:pointer;"
    >
      {#if loading}Mendaftar...{/if}
      {#if !loading}Daftar{/if}
    </button>

    <p style="margin:6px 0 0;color:#4a5568;font-size:13px;text-align:center;">
      Sudah punya akun? <a href="/auth/login" style="color:#2563eb;text-decoration:none;">Masuk</a>
    </p>
  </form>
</div>
