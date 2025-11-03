<script lang="ts">
  import { onMount } from 'svelte';
  import Swal from 'sweetalert2';
  import { apiFetch, getToken } from '$lib/api';
  import { setUser, patchUser } from '$lib/stores/user';

  // ===== UI & form state =====
  let activeTab: 'profile' | 'keamanan' = 'profile';
  let loading = true;
  let saving = false;
  let errorMsg = '';
  let disabled = false;

  // snapshot dari server untuk cek "dirty"
  let serverName = '';
  let serverEmail = '';

  let formData = {
    name: '',
    email: '',
    country: 'User_1',
    project: true,
    activity: false,
    mitra: false,
    pilihRole: 'admin'
  };

  // reaktif: tombol save nonaktif jika tidak ada yang berubah
  $: isDirty = formData.name.trim() !== serverName;

  // ===== SweetAlert helpers =====
  function toast(icon: 'success' | 'error', title: string, text?: string) {
    Swal.fire({
      icon, title, text,
      timer: 2600, showConfirmButton: false,
      toast: true, position: 'top-end'
    });
  }
  const showSuccess = (m: string) => toast('success', 'Berhasil!', m);
  const showError   = (m: string) => toast('error', 'Gagal', m);

  // ===== Minimal fetch helper (tanpa axios) =====
  async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers = new Headers(init.headers as HeadersInit);
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(path, {
      ...init,
      headers,
      body: init.body && typeof init.body !== 'string' ? JSON.stringify(init.body) : init.body
    });

    // coba parse JSON error friendly
    if (!res.ok) {
      let msg = res.statusText;
      try { const j = await res.json(); msg = (j?.message || j?.error || msg); } catch {}
      throw new Error(msg);
    }
    try { return await res.json() as T; } catch { return undefined as unknown as T; }
  }

  // ===== Load current user =====
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

<!-- ALERTS -->
{#if loading}
  <!-- TABS SKELETON -->
  <div class="inline-flex mb-5 rounded-2xl p-1 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10" role="status" aria-busy="true">
    <div class="h-8 w-20 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
    <div class="ml-1 h-8 w-24 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
  </div>
{:else}
  <!-- TABS -->
  <div class="inline-flex mb-5 rounded-2xl p-1 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10">
    <button
      on:click={() => (activeTab = 'profile')}
      class="px-4 py-2 rounded-xl text-sm font-semibold transition"
      class:bg-white={activeTab === 'profile'}
      class:dark:bg-[#12101d]={activeTab === 'profile'}
      class:text-violet-700={activeTab === 'profile'}
      class:dark:text-violet-300={activeTab === 'profile'}
    >
      Profile
    </button>
    <button
      on:click={() => (activeTab = 'keamanan')}
      class="px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300"
      class:bg-white={activeTab === 'keamanan'}
      class:dark:bg-[#12101d]={activeTab === 'keamanan'}
      class:text-violet-700={activeTab === 'keamanan'}
      class:dark:text-violet-300={activeTab === 'keamanan'}
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

<form on:submit={handleSubmit} class="max-w-1xl">
  {#if loading}
    {#if activeTab === 'profile'}
      <!-- PROFILE SKELETON -->
      <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm" role="status" aria-busy="true">
        <!-- Header -->
        <div class="pb-6">
          <div class="h-6 w-36 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
          <div class="mt-2 h-4 w-64 rounded-md bg-slate-200/60 dark:bg-white/10 animate-pulse"></div>
        </div>

        <div class="space-y-5">
          <!-- Name row -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start">
            <div class="sm:col-span-3">
              <div class="h-4 w-16 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
            </div>
            <div class="sm:col-span-9">
              <div class="h-10 w-full rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
            </div>
          </div>
          <!-- Email row -->
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
      </section>
    {:else}
      <!-- KEAMANAN SKELETON -->
      <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm" role="status" aria-busy="true">
        <!-- Header -->
        <div class="border-b border-black/5 dark:border-white/10 pb-6">
          <div class="h-5 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
          <div class="mt-2 h-4 w-64 rounded-md bg-slate-200/60 dark:bg-white/10 animate-pulse"></div>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-6">
          <!-- Select user -->
          <div class="sm:col-span-3">
            <div class="h-4 w-20 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
            <div class="mt-2 h-10 w-full rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
          </div>

          <!-- Role radios -->
          <div class="sm:col-span-3">
            <div class="h-4 w-20 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
            <div class="mt-4 space-y-3">
              {#each Array(3) as _}
                <div class="flex items-center gap-3">
                  <div class="h-4 w-4 rounded-full bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                  <div class="h-4 w-16 rounded-md bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Jobs checkboxes -->
          <div class="sm:col-span-6">
            <div class="h-4 w-20 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
            <div class="mt-3 grid sm:grid-cols-3 gap-3">
              {#each Array(3) as _}
                <div class="flex items-center gap-3 rounded-xl border border-black/5 dark:border-white/10 px-3 py-2 bg-white/50 dark:bg-white/5">
                  <div class="h-4 w-4 rounded-sm bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                  <div class="h-4 w-16 rounded-md bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>
    {/if}

    <!-- Actions skeleton -->
    <div class="mt-6 flex items-center justify-end gap-3">
      <div class="h-9 w-16 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
      <div class="h-9 w-20 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
    </div>
  {:else}
    <!-- ======= KONTEN ======= -->
    {#if activeTab === 'profile'}
      <section
        id="panel-profile"
        class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm">
        <!-- Header -->
        <div class="border-b border-black/5 dark:border-white/10 pb-6 mb-6">
          <h2 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kelola informasi data profile kamu.
          </p>
        </div>

        <!-- Body rows: 2 kolom label/field -->
        <div class="space-y-5">
          <!-- Name (editable) -->
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

          <!-- Email (readonly) -->
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
              <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Email hanya ditampilkan dan tidak bisa diubah.
              </p>
            </div>
          </div>
        </div>
      </section>
    {/if}
    {#if activeTab === 'keamanan'}
      <section
        id="panel-keamanan"
        class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm">
        <div class="border-b border-black/5 dark:border-white/10 pb-6">
          <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Role & Job</h2>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Atur role & job akses pengguna.</p>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-6">
          <div class="sm:col-span-3">
            <label for="country" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Pilih User</label>
            <div class="mt-2 relative">
              <select id="country" bind:value={formData.country}
                class="w-full appearance-none rounded-xl bg-white dark:bg-[#0f0d1b] py-2 pr-8 pl-3
                      text-slate-900 dark:text-slate-100 -outline-offset-1
                      outline-slate-200/80 dark:outline-white/10 focus:outline-2 focus:-outline-offset-2 focus:outline-violet-600">
                <option>User_1</option><option>User_2</option><option>User_3</option><option>User_4</option>
              </select>
              <svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400"
                  viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06Z" />
              </svg>
            </div>
          </div>

          <!-- Role radios -->
          <fieldset class="sm:col-span-3">
            <legend class="text-sm font-semibold text-slate-900 dark:text-slate-100">Pilih Role</legend>
            <div class="mt-4 space-y-3">
              {#each ['admin','staff','user'] as role}
                <label class="flex items-center gap-3">
                  <input type="radio" bind:group={formData.pilihRole} value={role}
                        class="size-4 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f0d1b]
                                checked:border-violet-600 checked:bg-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" />
                  <span class="text-sm text-slate-900 dark:text-slate-100">{role[0].toUpperCase() + role.slice(1)}</span>
                </label>
              {/each}
            </div>
          </fieldset>

          <!-- Jobs checkboxes -->
          <fieldset class="sm:col-span-6">
            <legend class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Pilih Job</legend>
            <div class="grid sm:grid-cols-3 gap-3">
              {#each [
                { id:'project',  label:'Project',  bind:'project' },
                { id:'activity', label:'Activity', bind:'activity' },
                { id:'mitra',    label:'Mitra',    bind:'mitra' }
              ] as j}
                <label class="flex items-center gap-3 rounded-xl border border-black/5 dark:border-white/10 px-3 py-2 bg-white/50 dark:bg-white/5">
                  <input id={j.id} type="checkbox" bind:checked={formData[j.bind as 'project'|'activity'|'mitra']}
                    class="size-4 rounded-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f0d1b]
                          checked:border-violet-600 checked:bg-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" />
                  <span class="text-sm text-slate-900 dark:text-slate-100">{j.label}</span>
                </label>
              {/each}
            </div>
          </fieldset>
        </div>
      </section>
    {/if}

    <!-- Actions (punyamu) -->
    <div class="mt-6 flex items-center justify-end gap-3">
      <button type="button" on:click={handleCancel}
              class="text-sm font-semibold text-slate-900 dark:text-slate-200">Cancel</button>
      <button type="submit"
              class="rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60"
              disabled={saving || loading || !isDirty}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  {/if}
</form>

