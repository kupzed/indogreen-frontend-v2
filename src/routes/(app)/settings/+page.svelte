<script lang="ts">
  import { onMount } from 'svelte';
  import Swal from 'sweetalert2';
  import { apiFetch } from '$lib/api';
  import { setUser, patchUser } from '$lib/stores/user';

  // ===== UI & Global State =====
  let activeTab: 'profile' | 'keamanan' | 'role' = 'profile';
  let loading = true;
  let saving = false;
  let errorMsg = '';

  // State khusus Role
  let canManageRoles = false;
  let currentIsOnlyAdmin = false;
  let savingRole = false;

  // ===== Profile State =====
  let serverName = '';
  let serverEmail = '';

  let formData = {
    name: '',
    email: ''
  };

  // reaktif: tombol save nonaktif jika tidak ada yang berubah
  $: isDirtyProfile = formData.name.trim() !== serverName;

  // ===== Password State =====
  let pw = { current: '', next: '', confirm: '' };
  let showPw = { current: false, next: false, confirm: false };
  let savingPw = false;

  $: pwRules = {
    len8: pw.next.length >= 8,
    hasLower: /[a-z]/.test(pw.next),
    hasUpper: /[A-Z]/.test(pw.next),
    notSameAsOld: pw.next !== '' && pw.current !== '' && pw.next !== pw.current,
    confirmMatch: pw.next !== '' && pw.next === pw.confirm
  };

  $: canUpdatePw =
    pwRules.len8 &&
    pwRules.hasLower &&
    pwRules.hasUpper &&
    pwRules.notSameAsOld &&
    pwRules.confirmMatch &&
    !savingPw;

  // ===== ROLE MANAGEMENT STATE (DYNAMIC) =====
  
  // Tipe data untuk konfigurasi yang diterima dari backend
  type ModuleConfig = { key: string; label: string; desc?: string };
  type ActionConfig = { key: string; label: string };

  // Variabel untuk menyimpan config (bukan konstanta lagi)
  let moduleList: ModuleConfig[] = [];
  let actionList: ActionConfig[] = [];

  type RoleUser = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  };

  // Struktur permissions sekarang dynamic: { "project": { "view": true, ... }, ... }
  type ModulesState = Record<string, Record<string, boolean>>;

  type RoleForm = {
    userId: string;
    selectedRole: string;
    modules: ModulesState;
  };

  let users: RoleUser[] = [];
  let myRoles: string[] = [];
  let selectedUserIsSuperAdmin = false;
  let currentIsSuperAdmin = false;

  // reactive list of visible roles depending on current user's privilege
  $: roleOptions = currentIsSuperAdmin ? ['user', 'staff', 'admin', 'super_admin'] : ['user', 'staff', 'admin'];

  let roleData: RoleForm = {
    userId: '',
    selectedRole: 'user',
    modules: {} // Inisialisasi kosong, nanti diisi createEmptyModules setelah fetch config
  };

  let initialRoleData: RoleForm = {
    userId: '',
    selectedRole: 'user',
    modules: {}
  };

  // modul mana yang sedang di-expand (key: boolean)
  let expandedModules: Record<string, boolean> = {};

  $: roleDirty = JSON.stringify(roleData) !== JSON.stringify(initialRoleData);

  // ===== Helpers =====
  function toast(icon: 'success' | 'error', title: string, text?: string) {
    Swal.fire({
      icon,
      title,
      text,
      timer: 2600,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
  const showSuccess = (m: string) => toast('success', 'Berhasil!', m);
  const showError = (m: string) => toast('error', 'Gagal', m);

  // ===== LOGIC: ROLE =====

  // Membuat object state permission kosong berdasarkan moduleList & actionList
  function createEmptyModules(): ModulesState {
    const mods: ModulesState = {};
    for (const m of moduleList) {
      mods[m.key] = {};
      for (const a of actionList) {
        mods[m.key][a.key] = false;
      }
    }
    return mods;
  }

  function cloneModules(mods: ModulesState): ModulesState {
    // Deep clone sederhana karena strukturnya dinamis
    return JSON.parse(JSON.stringify(mods));
  }

  function applyUserRole(user: RoleUser | null) {
    // Pastikan config sudah ter-load sebelum apply role
    if (moduleList.length === 0) return;

    if (!user) {
      const empty = createEmptyModules();
      roleData = {
        userId: '',
        selectedRole: 'user',
        modules: empty
      };
      selectedUserIsSuperAdmin = false;
      initialRoleData = {
        userId: '',
        selectedRole: 'user',
        modules: cloneModules(empty)
      };
      return;
    }

    const perms = user.permissions ?? [];
    const modules = createEmptyModules();

    // Isi modules berdasarkan permission string yang dimiliki user (misal: "project-view")
    for (const m of moduleList) {
      for (const a of actionList) {
        const permName = `${m.key}-${a.key}`;
        if (modules[m.key]) {
             modules[m.key][a.key] = perms.includes(permName);
        }
      }
    }

    roleData = {
      userId: String(user.id),
      selectedRole: user.roles && user.roles.length > 0 ? user.roles[0] : 'user',
      modules
    };

    selectedUserIsSuperAdmin = user.roles?.includes('super_admin') ?? false;

    initialRoleData = {
      userId: roleData.userId,
      selectedRole: roleData.selectedRole,
      modules: cloneModules(roleData.modules)
    };
  }

  function buildPermissionsPayload(r: RoleForm): Record<string, boolean> {
    const permissions: Record<string, boolean> = {};

    for (const m of moduleList) {
      const mod = r.modules[m.key];
      if (!mod) continue;
      
      for (const a of actionList) {
        // key permission yang dikirim ke backend: "namamodul-namaaksi"
        permissions[`${m.key}-${a.key}`] = mod[a.key];
      }
    }

    return permissions;
  }

  function toggleModuleAll(moduleKey: string, checked: boolean) {
    if (!roleData.modules[moduleKey]) return;

    // Buat salinan state module saat ini
    const updatedModule = { ...roleData.modules[moduleKey] };
    
    // Set semua action menjadi nilai checked
    for (const a of actionList) {
        updatedModule[a.key] = checked;
    }

    roleData = {
      ...roleData,
      modules: {
        ...roleData.modules,
        [moduleKey]: updatedModule
      }
    };
  }

  function handleToggleAction(
    moduleKey: string,
    actionKey: string,
    checked: boolean
  ) {
    if (!roleData.modules[moduleKey]) return;

    const updatedModule = {
      ...roleData.modules[moduleKey],
      [actionKey]: checked
    };

    roleData = {
      ...roleData,
      modules: {
        ...roleData.modules,
        [moduleKey]: updatedModule
      }
    };
  }

  function moduleAllChecked(moduleKey: string): boolean {
    const mod = roleData.modules[moduleKey];
    if (!mod) return false;
    // Cek apakah setiap action di actionList bernilai true
    return actionList.every((a) => mod[a.key]);
  }

  function moduleSomeChecked(moduleKey: string): boolean {
    const mod = roleData.modules[moduleKey];
    if (!mod) return false;
    const any = actionList.some((a) => mod[a.key]);
    const all = actionList.every((a) => mod[a.key]);
    return any && !all;
  }

  function indeterminate(node: HTMLInputElement, value: boolean) {
    node.indeterminate = Boolean(value);
    return {
      update(value: boolean) {
        node.indeterminate = Boolean(value);
      }
    };
  }

  function syncChecked(node: HTMLInputElement, value: boolean) {
    node.checked = Boolean(value);
    return {
      update(value: boolean) {
        node.checked = Boolean(value);
      }
    };
  }

  async function handleSubmitRole() {
    if (!roleDirty || savingRole) return;
    if (!roleData.userId) {
      showError('Silakan pilih user terlebih dahulu.');
      return;
    }

    savingRole = true;
    try {
      await apiFetch('/auth/role', {
        method: 'PUT',
        auth: true,
        body: {
          user_id: Number(roleData.userId),
          permissions: buildPermissionsPayload(roleData),
          role: roleData.selectedRole
        }
      });

      // Update snapshot agar tombol save disable kembali
      initialRoleData = {
        userId: roleData.userId,
        selectedRole: roleData.selectedRole,
        modules: cloneModules(roleData.modules)
      };
      showSuccess('Role & akses berhasil diperbarui');
    } catch (err: any) {
      const msg = err?.message || 'Gagal menyimpan pengaturan role.';
      showError(msg);
    } finally {
      savingRole = false;
    }
  }

  function handleResetRole() {
    roleData = {
      userId: initialRoleData.userId,
      selectedRole: initialRoleData.selectedRole,
      modules: cloneModules(initialRoleData.modules)
    };
  }

  // ===== LOGIC: PROFILE =====
  async function handleSubmitProfile(e: Event) {
    e.preventDefault();
    if (!isDirtyProfile) return;
    saving = true;
    errorMsg = '';
    try {
      const data: any = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: { name: formData.name },
        auth: true
      });

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

  async function handleCancelProfile() {
    // Reset ke data server
    formData.name = serverName;
    formData.email = serverEmail;
  }

  // ===== LOGIC: PASSWORD =====
  async function handleChangePassword() {
    if (!canUpdatePw) return;
    savingPw = true;
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
      savingPw = false;
    }
  }

  // ===== BOOTSTRAP DATA =====
  onMount(async () => {
    loading = true;
    errorMsg = '';
    try {
      // 0. Get Config (Modules & Actions) dari Backend
      // Kita panggil ini DULUAN agar kita tahu struktur permission sebelum load user
      const configRes: any = await apiFetch('/auth/role/config', { auth: true });
      moduleList = configRes?.modules ?? [];
      actionList = configRes?.actions ?? [];

      // Inisialisasi expanded modules agar defaultnya terbuka semua (optional)
      moduleList.forEach(m => {
          expandedModules[m.key] = true;
      });
      
      // Inisialisasi struktur module kosong di roleData awal
      const emptyModules = createEmptyModules();
      roleData.modules = emptyModules;
      initialRoleData.modules = cloneModules(emptyModules);

      // 1. Get Profile
      const userData: any = await apiFetch('/auth/me', { method: 'POST', auth: true });
      serverName = userData?.name ?? '';
      serverEmail = userData?.email ?? '';
      formData.name = serverName;
      formData.email = serverEmail;
      setUser({ name: serverName, email: serverEmail });

      // 2. Get My Roles (Check permissions)
      const roleRes: any = await apiFetch('/auth/role/me', { auth: true });
      myRoles = roleRes?.roles ?? [];

      const isAdmin = myRoles.includes('admin');
      const isSA = myRoles.includes('super_admin');

      currentIsSuperAdmin = isSA;
      currentIsOnlyAdmin = isAdmin && !isSA;
      canManageRoles = isAdmin || isSA;

      // 3. Get Users List (If allowed)
      if (canManageRoles) {
        const usersRes: any = await apiFetch('/auth/role/users', { auth: true });
        users = usersRes?.data ?? usersRes ?? [];

        if (users.length > 0) applyUserRole(users[0]);
      }
    } catch (err: any) {
      console.error(err);
      errorMsg = err?.message || 'Gagal memuat data sistem.';
      showError(errorMsg);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Settings - Indogreen</title>
</svelte:head>

<div class="mb-6 flex items-center justify-between">
  <h1 class="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
</div>

{#if loading}
  <div class="inline-flex mb-5 rounded-2xl p-1 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10">
    <div class="h-8 w-20 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
    <div class="ml-1 h-8 w-24 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
    <div class="ml-1 h-8 w-20 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
  </div>
{:else}
  <div class="inline-flex mb-5 rounded-2xl p-1 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10" role="tablist" aria-label="Pengaturan">
    <button
      id="tab-profile" role="tab" aria-controls="panel-profile" aria-selected={activeTab === 'profile'}
      on:click={() => (activeTab = 'profile')}
      class="px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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
      class="px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      class:bg-white={activeTab === 'keamanan'}
      class:dark:bg-violet-900={activeTab === 'keamanan'}
      class:text-violet-800={activeTab === 'keamanan'}
      class:dark:text-white={activeTab === 'keamanan'}
    >
      Keamanan
    </button>

    {#if canManageRoles}
      <button
        on:click={() => (activeTab = 'role')}
        class="px-4 py-2 rounded-xl text-sm font-semibold transition capitalize
               {activeTab === 'role' 
                 ? 'bg-white text-violet-800 shadow-sm dark:bg-violet-900 dark:text-white' 
                 : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}"
      >
        Role & Akses
      </button>
    {/if}
  </div>
{/if}

{#if errorMsg}
  <div class="mb-4 rounded-2xl border border-red-200/50 dark:border-red-800/40 bg-red-50/70 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">
    {errorMsg}
  </div>
{/if}

<div class="max-w-1xl">  
  {#if activeTab === 'profile'}
    <div id="panel-profile" role="tabpanel">
      <form on:submit={handleSubmitProfile}>
        <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm">
          <div class="border-b border-black/5 dark:border-white/10 pb-6 mb-6">
            <h2 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">Personal Info</h2>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Update informasi dasar akun Anda.</p>
          </div>
          
          <div class="space-y-5">
            <div>
              <label for="name" class="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-2">Full Name</label>
              <input id="name" type="text" bind:value={formData.name} disabled={loading || saving}
                class="block w-full rounded-xl bg-white dark:bg-[#0f0d1b] px-3 py-2 text-slate-900 dark:text-slate-100 outline-slate-200/80 dark:outline-white/10 focus:outline-violet-600 disabled:opacity-60" />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-2">Email Address</label>
              <input id="email" type="email" value={formData.email} readonly disabled
                class="block w-full rounded-xl bg-slate-100/70 dark:bg-slate-950/70 px-3 py-2 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none" />
              <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Email hanya ditampilkan dan tidak bisa diubah.</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" on:click={handleCancelProfile}
              class="text-sm font-semibold text-slate-900 dark:text-slate-200 px-3 py-2">Reset</button>
            <button type="submit" disabled={saving || !isDirtyProfile}
              class="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>
      </form>
    </div>
  {/if}

  {#if activeTab === 'keamanan'}
    <div id="panel-keamanan" role="tabpanel" aria-labelledby="tab-keamanan">
      {#if loading}
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
            <div class="lg:col-span-2 space-y-5">
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

  {#if activeTab === 'role' && canManageRoles}
    <div id="panel-role" role="tabpanel">
      <form on:submit|preventDefault={handleSubmitRole}>
        {#if loading}
          <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-6 shadow-sm animate-pulse">
            <div class="h-6 w-32 bg-slate-200 dark:bg-white/10 rounded mb-6"></div>
            <div class="h-10 w-full bg-slate-200 dark:bg-white/10 rounded-xl mb-8"></div>
            <div class="grid grid-cols-3 gap-4 mb-8">
              <div class="h-24 bg-slate-200 dark:bg-white/10 rounded-xl"></div>
              <div class="h-24 bg-slate-200 dark:bg-white/10 rounded-xl"></div>
              <div class="h-24 bg-slate-200 dark:bg-white/10 rounded-xl"></div>
            </div>
          </section>
        {:else}
          <section
            class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 sm:p-6 lg:p-8 shadow-sm"
          >
            <div class="border-b border-black/5 dark:border-white/10 pb-6 mb-6">
              <h2 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">Role Management</h2>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Role kamu adalah <b>'{myRoles.length ? myRoles.join(', ') : '—'}'.</b>
                Atur role dan permission detail (view, create, update, delete) untuk setiap modul.
              </p>
            </div>

            <div class="mb-8">
              <label
                for="selectUser"
                class="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-2"
              >
                Pilih User Target
              </label>
              <div class="relative">
                <select
                  id="selectUser"
                  bind:value={roleData.userId}
                  on:change={(e) => {
                    const uid = Number((e.currentTarget as HTMLSelectElement).value);
                    const u = users.find((x) => x.id === uid) ?? null;
                    applyUserRole(u);
                  }}
                  disabled={loading || savingRole}
                  class="block w-full appearance-none rounded-xl bg-white dark:bg-[#0f0d1b] pl-4 pr-10 py-2 
                         text-slate-900 dark:text-slate-100 outline-slate-200/80 dark:outline-white/10 
                         focus:outline-2 focus:outline-violet-600 shadow-sm transition-all cursor-pointer"
                >
                  {#if users.length === 0}
                    <option value="">Tidak ada data user</option>
                  {:else}
                    {#each users as u}
                      <option value={String(u.id)}>{u.name} — {u.email}</option>
                    {/each}
                  {/if}
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
                <span class="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-3">
                  Tipe Akun (Role)
                </span>
                <div class="space-y-3">
                  {#each roleOptions as rOption}
                    <label
                      class="relative flex items-center p-3 rounded-xl border transition-all cursor-pointer
                        {roleData.selectedRole === rOption 
                          ? 'bg-violet-50/50 border-violet-500 dark:bg-violet-900/20 dark:border-violet-400' 
                          : 'bg-white dark:bg-[#0f0d1b] border-slate-200 dark:border-white/10 hover:border-violet-300'}
                        {(currentIsOnlyAdmin && selectedUserIsSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}"
                    >
                      <input
                        type="radio"
                        name="roleGroup"
                        value={rOption}
                        bind:group={roleData.selectedRole}
                        disabled={currentIsOnlyAdmin && selectedUserIsSuperAdmin}
                        class="sr-only"
                      />
                      <div
                        class="flex items-center justify-center h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600 mr-3
                               {roleData.selectedRole === rOption ? 'border-violet-600 bg-violet-600' : ''}"
                      >
                        {#if roleData.selectedRole === 'super_admin' && !currentIsSuperAdmin}
                          <div class="mb-3 text-sm text-red-600 dark:text-red-400">
                            Target user memiliki role <b>super_admin</b>. Anda tidak memiliki hak untuk mengubah role ini.
                          </div>
                        {/if}
                      </div>
                      <div>
                        <span
                          class="block text-sm font-semibold capitalize text-slate-900 dark:text-slate-100"
                        >
                          {rOption}
                        </span>
                        <span class="block text-xs text-slate-500 dark:text-slate-400">
                          {rOption === 'super_admin'
                            ? 'Akses penuh sistem' : rOption === 'admin'
                            ? 'Dapat memberi role pada user' : rOption === 'staff'
                            ? 'Manajemen operasional (dapat dikustom)'
                            : 'Akses pengguna standar (dapat dikustom)'}
                        </span>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>

              <div>
                <span class="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-3">
                  Hak Akses per Modul
                </span>

                <div
                  class="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-4 space-y-3"
                >
                  {#each moduleList as mod (mod.key)}
                    <div class="rounded-lg border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#0f0d1b]">
                      <div class="flex items-center justify-between px-3 py-2">
                        <div class="flex items-center gap-3">
                          <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-600 dark:bg-neutral-800 dark:border-neutral-600"
                            use:syncChecked={moduleAllChecked(mod.key)}
                            use:indeterminate={moduleSomeChecked(mod.key)}
                            on:change={(e) =>
                              toggleModuleAll(
                                mod.key,
                                (e.currentTarget as HTMLInputElement).checked
                              )}
                            disabled={loading || savingRole}
                          />
                          <div>
                            <div
                              class="text-sm font-semibold text-slate-900 dark:text-slate-100"
                            >
                              {mod.label}
                            </div>
                            <p class="text-xs text-slate-500 dark:text-slate-400">
                              {mod.desc}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                          on:click={() =>
                            (expandedModules = {
                              ...expandedModules,
                              [mod.key]: !expandedModules[mod.key]
                            })}
                        >
                          Detail
                          <svg
                            class="h-3 w-3 transition-transform"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            class:rotate-90={expandedModules[mod.key]}
                          >
                            <path
                              d="M7 5l6 5-6 5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      {#if expandedModules[mod.key]}
                        <div class="border-t border-slate-200/80 dark:border-white/10 px-3 py-2">
                          <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                            {#each actionList as action (action.key)}
                              <label class="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                                <input
                                  type="checkbox"
                                  class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-600 dark:bg-neutral-800 dark:border-neutral-600"
                                  checked={roleData.modules[mod.key][action.key]}
                                  on:change={(e) =>
                                    handleToggleAction(
                                      mod.key,
                                      action.key,
                                      (e.currentTarget as HTMLInputElement).checked
                                    )}
                                  disabled={loading || savingRole}
                                />
                                <span>{action.label}</span>
                              </label>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <div
              class="mt-8 pt-6 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-3"
            >
              <button
                type="button"
                on:click={handleResetRole}
                disabled={!roleDirty || savingRole}
                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition disabled:opacity-50"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={
                  !roleDirty ||
                  savingRole ||
                  !roleData.userId ||
                  (currentIsOnlyAdmin && selectedUserIsSuperAdmin)
                }
                class="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {#if savingRole}
                  <svg
                    class="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                {:else}
                  Simpan Perubahan
                {/if}
              </button>
            </div>
          </section>
        {/if}
      </form>
    </div>
  {/if}
</div>