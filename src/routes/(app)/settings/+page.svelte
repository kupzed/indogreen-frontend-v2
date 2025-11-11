<script lang="ts">
  import { onMount } from 'svelte';
  import Swal from 'sweetalert2';
  import { apiFetch, getToken } from '$lib/api';
  import { setUser, patchUser } from '$lib/stores/user';

  // ===== UI & global state =====
  let activeTab: 'profile' | 'keamanan' = 'profile';
  let loading = true;
  let saving = false;
  let errorMsg = '';
  let disabled = false;

  // snapshot untuk cek "dirty"
  let serverName = '';
  let serverEmail = '';

  // ===== Profile form =====
  let formData = {
    name: '',
    email: '',
  };

  // reaktif: tombol save nonaktif jika tidak ada yang berubah
  $: isDirty = formData.name.trim() !== serverName;

  // ===== SweetAlert toast helpers =====
  function toast(icon: 'success' | 'error', title: string, text?: string) {
    Swal.fire({
      icon, title, text,
      timer: 2600, showConfirmButton: false,
      toast: true, position: 'top-end'
    });
  }
  const showSuccess = (m: string) => toast('success', 'Berhasil!', m);
  const showError   = (m: string) => toast('error', 'Gagal', m);

  // ===== Password (Keamanan) =====
  let pw = { current: '', next: '', confirm: '' };
  let showPw = { current: false, next: false, confirm: false };
  let savingPw = false; // <-- NEW

  $: pwRules = {
    len8: pw.next.length >= 8,
    hasLower: /[a-z]/.test(pw.next),
    hasUpper: /[A-Z]/.test(pw.next),
    notSameAsOld: pw.next !== '' && pw.current !== '' && pw.next !== pw.current,
    confirmMatch: pw.next !== '' && pw.next === pw.confirm
  };

  // ikutkan !savingPw supaya tombol ikut nonaktif saat submit berlangsung
  $: canUpdatePw =
    pwRules.len8 && pwRules.hasLower && pwRules.hasUpper && pwRules.notSameAsOld && pwRules.confirmMatch && !savingPw;

  async function handleChangePassword() {
    if (!canUpdatePw) return;
    savingPw = true; // <-- NEW
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        auth: true,
        body: {
          current_password: pw.current,
          password: pw.next,
          password_confirmation: pw.confirm
        }
      });
      showSuccess('Password berhasil diperbarui');
      pw = { current: '', next: '', confirm: '' };
      showPw = { current: false, next: false, confirm: false };
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui password.';
      showError(msg);
    } finally {
      savingPw = false; // <-- NEW
    }
  }


  // ===== Bootstrap user data =====
  onMount(async () => {
    loading = true; errorMsg = '';
    try {
      // backend kamu: POST /auth/me
      const data: any = await apiFetch('/auth/me', { method: 'POST', auth: true });
      serverName  = data?.name  ?? '';
      serverEmail = data?.email ?? '';
      formData.name  = serverName;
      formData.email = serverEmail;
      setUser({ name: serverName, email: serverEmail });
    } catch (err: any) {
      errorMsg = err?.message || 'Gagal memuat data pengguna.';
      showError(errorMsg);
    } finally {
      loading = false;
    }
  });

  // ===== Actions (Profile) =====
  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!isDirty) return;
    saving = true; errorMsg = '';
    try {
      const data: any = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: { name: formData.name },
        auth: true
      });
      // update snapshot & store
      serverName = data?.name ?? formData.name;
      formData.name = serverName;
      patchUser({ name: serverName });
      showSuccess('Profil berhasil diperbarui');
    } catch (err: any) {
      errorMsg = err?.message || 'Gagal memperbarui nama.';
      showError(errorMsg);
    } finally {
      saving = false;
    }
  }

  async function handleCancel() {
    loading = true; errorMsg = '';
    try {
      const data: any = await apiFetch('/auth/me', { method: 'POST', auth: true });
      serverName  = data?.name  ?? '';
      serverEmail = data?.email ?? '';
      formData.name  = serverName;
      formData.email = serverEmail;
      setUser({ name: serverName, email: serverEmail });
    } catch {
      errorMsg = 'Gagal memulihkan data.'; showError(errorMsg);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - Indogreen</title>
</svelte:head>

<!-- PAGE HEADER -->
<div class="mb-6 flex items-center justify-between">
  <h1 class="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
</div>

<!-- TABS -->
{#if loading}
  <!-- Tabs skeleton -->
  <div class="inline-flex mb-5 rounded-2xl p-1 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10" role="tablist" aria-busy="true">
    <div class="h-8 w-20 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
    <div class="ml-1 h-8 w-24 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
  </div>
{:else}
  <div class="inline-flex mb-5 rounded-2xl p-1 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10" role="tablist" aria-label="Pengaturan">
    <button
      id="tab-profile" role="tab" aria-controls="panel-profile" aria-selected={activeTab === 'profile'}
      on:click={() => (activeTab = 'profile')}
      class="px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300"
      class:bg-white={activeTab === 'profile'}
      class:dark:bg-violet-900={activeTab === 'profile'}
      class:text-violet-800={activeTab === 'profile'}
      class:dark:text-white={activeTab === 'profile'}
    >
      Profile
    </button>
    <button
      id="tab-keamanan" role="tab" aria-controls="panel-keamanan" aria-selected={activeTab === 'keamanan'}
      on:click={() => (activeTab = 'keamanan')}
      class="px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300"
      class:bg-white={activeTab === 'keamanan'}
      class:dark:bg-violet-900={activeTab === 'keamanan'}
      class:text-violet-800={activeTab === 'keamanan'}
      class:dark:text-white={activeTab === 'keamanan'}
    >
      Keamanan
    </button>
  </div>
{/if}

{#if errorMsg}
  <div class="mb-4 rounded-2xl border border-red-200/50 dark:border-red-800/40 bg-red-50/70 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">
    {errorMsg}
  </div>
{/if}

<div class="max-w-1xl">
  <!-- ===================== PROFILE TAB ===================== -->
  {#if activeTab === 'profile'}
    <!-- role tabpanel DI PEMBUNGKUS, bukan di <form> -->
    <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
      <form on:submit={handleSubmit}>
        {#if loading}
          <!-- PROFILE SKELETON -->
          <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm" role="status" aria-busy="true">
            <div class="pb-6">
              <div class="h-6 w-36 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
              <div class="mt-2 h-4 w-64 rounded-md bg-slate-200/60 dark:bg-white/10 animate-pulse"></div>
            </div>
            <div class="space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start">
                <div class="sm:col-span-3">
                  <div class="h-4 w-16 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                </div>
                <div class="sm:col-span-9">
                  <div class="h-10 w-full rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
                <div class="sm:col-span-3">
                  <div class="h-4 w-14 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                </div>
                <div class="sm:col-span-9">
                  <div class="h-10 w-full rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"></div>
                  <div class="mt-2 h-3 w-56 rounded-md bg-slate-200/50 dark:bg-white/10 animate-pulse"></div>
                </div>
              </div>
            </div>
            <div class="mt-6 flex items-center justify-end gap-3">
              <div class="h-9 w-16 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
              <div class="h-9 w-20 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
            </div>
          </section>
        {:else}
          <!-- ======= KONTEN PROFILE ======= -->
          <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm">
            <div class="border-b border-black/5 dark:border-white/10 pb-6 mb-6">
              <h2 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Kelola informasi data profile kamu.</p>
            </div>

            <div class="space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start">
                <label for="name" class="sm:col-span-3 text-sm font-medium text-slate-900 dark:text-slate-300">Name</label>
                <div class="sm:col-span-9">
                  <input
                    id="name"
                    type="text"
                    bind:value={formData.name}
                    autocomplete="name"
                    class="block w-full rounded-xl bg-white dark:bg-[#0f0d1b] px-3 py-2
                          text-slate-900 dark:text-slate-100 -outline-offset-1
                          outline-slate-200/80 dark:outline-white/10 placeholder:text-slate-400
                          focus:outline-2 focus:-outline-offset-2 focus:outline-violet-600 disabled:opacity-60"
                    disabled={disabled || loading || saving}
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-center">
                <label for="email" class="sm:col-span-3 text-sm font-medium text-slate-900 dark:text-slate-300">Email</label>
                <div class="sm:col-span-9">
                  <input
                    id="email"
                    type="email"
                    bind:value={formData.email}
                    readonly
                    autocomplete="email"
                    class="block w-full rounded-xl bg-slate-100/70 dark:bg-slate-950/70 px-3 py-2
                          text-slate-700 dark:text-slate-300 -outline-offset-1
                          outline-slate-200/80 dark:outline-white/10 cursor-not-allowed"
                  />
                  <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Email hanya ditampilkan dan tidak bisa diubah.</p>
                </div>
              </div>
            </div>
            <!-- Actions -->
            <div class="mt-6 flex items-center justify-end gap-3">
              <button type="button" on:click={handleCancel}
                      class="text-sm font-semibold text-slate-900 dark:text-slate-200">Reset</button>
              <button type="submit"
                      class="rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500
                            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60"
                      disabled={saving || loading || !isDirty}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </section>
        {/if}
      </form>
    </div>
  {/if}


  <!-- ===================== KEAMANAN (PASSWORD) ===================== -->
  {#if activeTab === 'keamanan'}
    <div id="panel-keamanan" role="tabpanel" aria-labelledby="tab-keamanan">
      {#if loading}
        <!-- KEAMANAN SKELETON -->
        <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm" role="status" aria-busy="true">
          <div class="border-b border-black/5 dark:border-white/10 pb-6">
            <div class="h-5 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
            <div class="mt-2 h-4 w-64 rounded-md bg-slate-200/60 dark:bg-white/10 animate-pulse"></div>
          </div>
          <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-4">
              {#each Array(3) as _}
                <div class="h-10 w-full rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
              {/each}
              <div class="h-9 w-40 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
            </div>
            <div class="rounded-xl bg-slate-200/70 dark:bg-white/10 p-5 animate-pulse"></div>
          </div>
        </section>
      {:else}
        <section
          class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm"
          aria-busy={savingPw}
        >
          <div class="border-b border-black/5 dark:border-white/10 pb-6">
            <h2 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">Ubah Password</h2>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Ubah password dengan memasukkan password lama dan password baru.</p>
          </div>

          <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- LEFT: form -->
            <div class="lg:col-span-2 space-y-5">
              <!-- Lama -->
              <div>
                <span class="block text-sm font-medium text-slate-900 dark:text-slate-100">Password Lama</span>
                <div class="mt-2 relative">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    bind:value={pw.current}
                    autocomplete="current-password"
                    class="block w-full rounded-xl bg-white dark:bg-[#0f0d1b] px-3 py-2 text-sm
                          text-slate-900 dark:text-slate-100 outline-slate-200/80 dark:outline-white/10 -outline-offset-1
                          focus:outline-2 focus:-outline-offset-2 focus:outline-violet-600 disabled:opacity-60"
                    placeholder="Masukkan password lama"
                    disabled={loading || savingPw}
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-2 my-auto p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 disabled:opacity-50"
                    on:click={() => (showPw = { ...showPw, current: !showPw.current })}
                    aria-label="Tampilkan/sembunyikan password lama"
                    disabled={loading || savingPw}
                  >
                    {#if showPw.current}
                      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0 0 9 12a3 3 0 0 0 3 3c.49 0 .95-.12 1.35-.33"/><path d="M6.61 6.61C4.27 7.98 2.73 10 2.73 10s3.64 6.27 9.27 6.27c1.06 0 2.07-.17 3.01-.49"/><path d="M17.94 13.11C19.73 11.86 21.27 10 21.27 10S17.64 3.73 12 3.73a8.8 8.8 0 0 0-2.18.28"/></svg>
                    {:else}
                      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                    {/if}
                  </button>
                </div>
              </div>

              <!-- Baru -->
              <div>
                <span class="block text-sm font-medium text-slate-900 dark:text-slate-100">Password Baru</span>
                <div class="mt-2 relative">
                  <input
                    type={showPw.next ? 'text' : 'password'}
                    bind:value={pw.next}
                    autocomplete="new-password"
                    class="block w-full rounded-xl bg-white dark:bg-[#0f0d1b] px-3 py-2 text-sm
                          text-slate-900 dark:text-slate-100 outline-slate-200/80 dark:outline-white/10 -outline-offset-1
                          focus:outline-2 focus:-outline-offset-2 focus:outline-violet-600 disabled:opacity-60"
                    placeholder="Masukkan password baru"
                    disabled={loading || savingPw}
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-2 my-auto p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 disabled:opacity-50"
                    on:click={() => (showPw = { ...showPw, next: !showPw.next })}
                    aria-label="Tampilkan/sembunyikan password baru"
                    disabled={loading || savingPw}
                  >
                    {#if showPw.next}
                      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0 0 9 12a3 3 0 0 0 3 3c.49 0 .95-.12 1.35-.33"/><path d="M6.61 6.61C4.27 7.98 2.73 10 2.73 10s3.64 6.27 9.27 6.27c1.06 0 2.07-.17 3.01-.49"/><path d="M17.94 13.11C19.73 11.86 21.27 10 21.27 10S17.64 3.73 12 3.73a8.8 8.8 0 0 0-2.18.28"/></svg>
                    {:else}
                      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                    {/if}
                  </button>
                </div>
              </div>

              <!-- Konfirmasi -->
              <div>
                <span class="block text-sm font-medium text-slate-900 dark:text-slate-100">Konfirmasi Password Baru</span>
                <div class="mt-2 relative">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    bind:value={pw.confirm}
                    autocomplete="new-password"
                    class="block w-full rounded-xl bg-white dark:bg-[#0f0d1b] px-3 py-2 text-sm
                          text-slate-900 dark:text-slate-100 outline-slate-200/80 dark:outline-white/10 -outline-offset-1
                          focus:outline-2 focus:-outline-offset-2 focus:outline-violet-600 disabled:opacity-60"
                    placeholder="Masukkan konfirmasi password"
                    disabled={loading || savingPw}
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-2 my-auto p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 disabled:opacity-50"
                    on:click={() => (showPw = { ...showPw, confirm: !showPw.confirm })}
                    aria-label="Tampilkan/sembunyikan konfirmasi password"
                    disabled={loading || savingPw}
                  >
                    {#if showPw.confirm}
                      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0 0 9 12a3 3 0 0 0 3 3c.49 0 .95-.12 1.35-.33"/><path d="M6.61 6.61C4.27 7.98 2.73 10 2.73 10s3.64 6.27 9.27 6.27c1.06 0 2.07-.17 3.01-.49"/><path d="M17.94 13.11C19.73 11.86 21.27 10 21.27 10S17.64 3.73 12 3.73a8.8 8.8 0 0 0-2.18.28"/></svg>
                    {:else}
                      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                    {/if}
                  </button>
                </div>
                {#if pw.confirm && !pwRules.confirmMatch}
                  <p class="mt-2 text-xs text-red-600 dark:text-red-400">Konfirmasi tidak sama.</p>
                {/if}
              </div>

              <div class="pt-2">
                <button
                  type="button"
                  on:click={handleChangePassword}
                  class="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500
                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60"
                  disabled={!canUpdatePw || savingPw}
                >
                  {#if savingPw}
                    <svg viewBox="0 0 24 24" class="h-4 w-4 animate-spin" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 3a9 9 0 1 0 9 9" stroke-linecap="round"/>
                    </svg>
                    Memperbarui…
                  {:else}
                    Update Password
                  {/if}
                </button>
              </div>
            </div>

            <!-- RIGHT: rules -->
            <aside class="rounded-2xl bg-teal-600/90 text-white p-5 dark:bg-teal-700">
              <h3 class="font-semibold text-lg">Persyaratan Password</h3>
              <p class="mt-1 text-sm opacity-90">Untuk membuat password yang kuat, ikuti aturan berikut:</p>
              <ul class="mt-4 space-y-2 text-sm">
                <li><span class="mr-1">{#if pwRules.len8}✅{:else}•{/if}</span>Minimal 8 karakter</li>
                <li><span class="mr-1">{#if pwRules.hasLower}✅{:else}•{/if}</span>Minimal satu huruf kecil</li>
                <li><span class="mr-1">{#if pwRules.hasUpper}✅{:else}•{/if}</span>Minimal satu huruf besar</li>
                <li><span class="mr-1">{#if pwRules.notSameAsOld}✅{:else}•{/if}</span>Tidak sama dengan password lama</li>
                <li><span class="mr-1">{#if pwRules.confirmMatch}✅{:else}•{/if}</span>Konfirmasi harus sama</li>
              </ul>
            </aside>
          </div>
        </section>
      {/if}
    </div>
  {/if}
</div>
