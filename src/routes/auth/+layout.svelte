<script lang="ts">
  import '../../app.css';
  import { goto } from '$app/navigation';
  import { getToken } from '$lib/api';

  let { children } = $props();

  // If already logged in, redirect to dashboard
  if (typeof window !== 'undefined') {
    const token = getToken();
    if (token) {
      goto('/dashboard');
    }
  }
</script>

<div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#f7fafc;padding:16px;">
  <div style="width:100%;max-width:420px;background:white;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.05);overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;background:#f9fbff;">
      <h1 style="margin:0;font-size:18px;font-weight:700;color:#1a202c;">Authentication</h1>
      <p style="margin:6px 0 0;color:#4a5568;font-size:13px;">Masuk atau daftar untuk melanjutkan</p>
    </div>
    <div style="padding:20px 24px;">
      {@render children?.()}
    </div>
  </div>
</div>


