<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';

  import Pagination from '$lib/components/Pagination.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import BarangCertificatesDetail from '$lib/components/detail/BarangCertificatesDetail.svelte';
  import BarangCertificateFormModal from '$lib/components/form/BarangCertificateFormModal.svelte';

  import BarangCertificateFilterDesktop from '$lib/components/filters/BarangCertificateFilterDekstop.svelte';
  import BarangCertificateFilterMobile from '$lib/components/filters/BarangCertificateFilterMobile.svelte';
  import { userPermissions } from '$lib/stores/permissions';

  type Mitra = { id: number; nama: string };
  type BarangCertificate = {
    id: number;
    name: string;
    no_seri: string;
    mitra_id: number | '' | null;
    mitra?: { id: number; nama: string } | null;
    created_at?: string;
    updated_at?: string;
  };

  // ====== DATA ======
  let items: BarangCertificate[] = [];
  let mitras: Mitra[] = [];
  let loading = true;
  let error = '';

  // ====== PERMISSIONS ======
  let canCreateBC = false;
  let canUpdateBC = false;
  let canDeleteBC = false;

  $: {
    const perms = $userPermissions ?? [];
    canCreateBC = perms.includes('bc-create');
    canUpdateBC = perms.includes('bc-update');
    canDeleteBC = perms.includes('bc-delete');
  }

  // ====== FILTER / QUERY STATE ======
  let search = '';
  let mitraFilter: number | '' = '';
  let sortDir: 'desc'|'asc' = 'desc';

  // ====== UI STATE ======
  let activeView: 'table' | 'list' = 'table';
  const views: Array<'table' | 'list'> = ['table', 'list'];
  function handleViewKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      let idx = views.indexOf(activeView);
      idx = e.key === 'ArrowRight' ? (idx + 1) % views.length : (idx - 1 + views.length) % views.length;
      activeView = views[idx];
    }
  }

  // sidebar & mobile modal
  let showSidebar = true;        // desktop toggle (default tampil)
  let showMobileFilter = false;  // mobile drawer

  // modal form & drawer
  let showCreateModal = false;
  let showEditModal = false;
  let editingItem: BarangCertificate | null = null;
  let showDetailDrawer = false;
  let selectedItem: BarangCertificate | null = null;

  // pagination
  let currentPage = 1;
  let lastPage = 1;
  let totalItems = 0;
  let perPage: number = 50;
  const perPageOptions = [10, 25, 50, 100];

  // form
  let form: { name: string; no_seri: string; mitra_id: number | '' | null } = {
    name: '', no_seri: '', mitra_id: ''
  };

  // ====== HELPERS ======
  function qs(obj: Record<string, any>) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
    });
    return p.toString();
  }

  function getMitraNameById(id?: number | '' | null) {
    if (id === '' || id === null || id === undefined) return '';
    return mitras.find((m) => m.id === id)?.nama ?? '';
  }

  async function fetchDependencies() {
    try {
      const res: any = await apiFetch('/barang-certificate/getFormDependencies', { auth: true });
      mitras = res?.data?.mitras ?? res?.mitras ?? res ?? [];
    } catch (err) {
      console.error('Failed to fetch dependencies:', err);
    }
  }

  async function fetchList() {
    loading = true; error = '';
    try {
      const url = `/barang-certificates?${qs({
        search,
        mitra_id: mitraFilter || '',
        page: currentPage,
        per_page: perPage,
        sort_by: 'created',
        sort_dir: sortDir,
      })}`;

      const res: any = await apiFetch(url, { auth: true });
      items       = res?.data ?? res?.items ?? res ?? [];
      currentPage = res?.pagination?.current_page ?? res?.current_page ?? 1;
      lastPage    = res?.pagination?.last_page   ?? res?.last_page   ?? 1;
      totalItems  = res?.pagination?.total       ?? res?.total       ?? (Array.isArray(items) ? items.length : 0);
    } catch (err: any) {
      error = err?.message || 'Gagal memuat data.';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!getToken()) { goto('/auth/login'); return; }
    fetchDependencies();
    fetchList();
  });

  function handleFilterOrSearch() { currentPage = 1; fetchList(); }

  function clearFilters() {
    search = '';
    mitraFilter = '';
    sortDir = 'desc';
    currentPage = 1;
    fetchList();
  }

  // desktop: update + fetch
  function onDesktopUpdate(e: CustomEvent<{key:any, value:any}>) {
    if (e.detail.key === 'mitra') mitraFilter = e.detail.value as number | '';
    if (e.detail.key === 'sortDir') sortDir = e.detail.value as 'desc' | 'asc';
    if (e.detail.key === 'search') search = e.detail.value as string | '';
    handleFilterOrSearch();
  }
  function onDesktopClear() { clearFilters(); }

  // mobile: update state saja, fetch saat Done
  function onMobileUpdate(e: CustomEvent<{key:any, value:any}>) {
    if (e.detail.key === 'mitra') mitraFilter = e.detail.value as number | '';
    if (e.detail.key === 'sortDir') sortDir = e.detail.value as 'desc' | 'asc';
    if (e.detail.key === 'search') search = e.detail.value as string | '';
    handleFilterOrSearch();
  }
  function onMobileClear() { clearFilters(); }
  function onMobileApply() {
    showMobileFilter = false;
    handleFilterOrSearch();
  }

  function toggleFilter() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      showMobileFilter = true;   // mobile -> drawer
    } else {
      showSidebar = !showSidebar; // desktop -> show/hide sidebar
    }
  }

  function goToPage(page: number) { if (page > 0 && page <= lastPage) { currentPage = page; fetchList(); } }

  function openCreateModal() {
    if (!canCreateBC) {
      console.warn('Blocked: lacking bc-create permission');
      return;
    }
    form = { name: '', no_seri: '', mitra_id: '' };
    showCreateModal = true;
  }
  function openEditModal(item: BarangCertificate) {
    if (!canUpdateBC) {
      console.warn('Blocked: lacking bc-update permission');
      return;
    }
    editingItem = { ...item };
    form = { name: item.name ?? '', no_seri: item.no_seri ?? '', mitra_id: item.mitra_id ?? '' };
    showEditModal = true;
  }
  function openDetailDrawer(item: BarangCertificate) { selectedItem = { ...item }; showDetailDrawer = true; }

  async function handleSubmitCreate() {
    if (!canCreateBC) {
      console.warn('Blocked: lacking bc-create permission (submit)');
      return;
    }
    try {
      await apiFetch('/barang-certificates', { method: 'POST', body: form, auth: true });
      alert('Data berhasil ditambahkan');
      goto('/barang-certificates'); showCreateModal = false; fetchList();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan data.'; alert('Error:\n' + msg);
    }
  }

  async function handleSubmitUpdate() {
    if (!editingItem?.id) return;
    if (!canUpdateBC) {
      console.warn('Blocked: lacking bc-update permission (submit)');
      return;
    }
    try {
      await apiFetch(`/barang-certificates/${editingItem.id}`, { method: 'PUT', body: form, auth: true });
      alert('Data berhasil diperbarui');
      goto('/barang-certificates'); showEditModal = false; fetchList();
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui data.'; alert('Error:\n' + msg);
    }
  }

  async function handleDelete(id: number) {
    if (!canDeleteBC) {
      console.warn('Blocked: lacking bc-delete permission');
      return;
    }
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await apiFetch(`/barang-certificates/${id}`, { method: 'DELETE', auth: true });
      alert('Data berhasil dihapus');
      goto('/barang-certificates'); fetchList();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  // --- kunci scroll saat overlay terbuka ---
  function lockBodyScroll(lock: boolean) {
    const body = document.body;
    if (!body) return;
    if (lock) {
      const scrollY = window.scrollY;
      body.dataset.scrollY = String(scrollY);
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';
      body.style.width = '100%';
    } else {
      const y = Number(body.dataset.scrollY || '0');
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';
      body.style.width = '';
      delete body.dataset.scrollY;
      window.scrollTo(0, y);
    }
  }
  $: lockBodyScroll(showMobileFilter || showDetailDrawer || showCreateModal || showEditModal);

  // Chips aktif
  $: activeFilterChips = [
    mitraFilter ? { key: 'mitra' as const, label: getMitraNameById(mitraFilter) || 'Mitra' } : null,
    (sortDir === 'asc' ? { key: 'sort', label: 'Urut: Create Terlama' } : null),
    search && { key: 'search', label: `Cari: ${search}` },
  ].filter(Boolean) as Array<{ key: 'mitra' | 'sort' | 'search'; label: string }>;
</script>

<svelte:head><title>Daftar Barang Sertifikat - Indogreen</title></svelte:head>

<!-- ====== GRID 2 KOLOM: SIDEBAR + KONTEN ====== -->
<div class={"grid grid-cols-1 gap-4 " + (showSidebar ? "lg:grid-cols-[260px_minmax(0,1fr)]" : "")}>
  <!-- KIRI: Sidebar filter (desktop) -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <aside role="complementary" aria-label="Filter" class={"hidden " + (showSidebar ? "lg:block" : "lg:hidden")}>
    <div class="sticky top-[72px]">
      <div class="max-h-[calc(100dvh-72px-48px)] overflow-y-auto overscroll-contain no-scrollbar [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]">
        <BarangCertificateFilterDesktop
          {mitras}
          mitraValue={mitraFilter}
          sortDir={sortDir}
          on:update={onDesktopUpdate}
          on:clear={onDesktopClear}
        />
      </div>
    </div>
  </aside>

  <!-- KANAN: konten utama -->
  <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]">
    <!-- sticky BAR hanya selebar kolom kanan -->
    <div class="border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10 sticky z-30 top-[60px] sm:top-[72px]">
      <!-- ACTION BAR -->
      <div class="flex items-center gap-2 flex-nowrap bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-2 py-2">
        <!-- Kiri: Filter + toggle view -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            on:click={toggleFilter}
            class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm
                   border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70
                   text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Filter">
            {#if showSidebar}
              <svg class="w-5 h-5 hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
              <svg class="w-5 h-5 lg:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M6 12h12M10 18h4"/></svg>
            {:else}
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M6 12h12M10 18h4"/></svg>
            {/if}
            <span class="sr-only">Filter</span>
          </button>

          <div class="bg-slate-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-md inline-flex"
               role="tablist" aria-label="Switch view" tabindex="0" on:keydown={handleViewKeydown}>
            <button on:click={() => (activeView='table')}
              class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
              class:bg-white={activeView==='table'} class:dark:bg-[#12101d]={activeView==='table'} class:shadow={activeView==='table'} title="Table">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><line x1="3.5" y1="9" x2="20.5" y2="9"></line><line x1="3.5" y1="13" x2="20.5" y2="13"></line><line x1="3.5" y1="17" x2="20.5" y2="17"></line></svg>
              <span class="sr-only">Tampilan Tabel</span>
            </button>
            <button on:click={() => (activeView='list')}
              class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
              class:bg-white={activeView==='list'} class:dark:bg-[#12101d]={activeView==='list'} class:shadow={activeView==='list'} title="List">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="5" cy="6" r="1.3"></circle><circle cx="5" cy="12" r="1.3"></circle><circle cx="5" cy="18" r="1.3"></circle><line x1="9" y1="6" x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line></svg>
              <span class="sr-only">Tampilan List</span>
            </button>
          </div>
        </div>

        <!-- Kanan: Search + Tambah -->
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div class="relative flex-1 min-w-0">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-black dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>
              </svg>
            </div>
            <input type="text" placeholder="Cari barang certificate..." bind:value={search} on:input={handleFilterOrSearch}
              class="block w-full pl-10 pr-3 h-9 rounded-md text-sm border border-black/5 dark:border-white/10
                     bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 placeholder-slate-500
                     dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
          {#if canCreateBC}
            <button
              on:click={openCreateModal}
              class="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 grid place-items-center shrink-0"
              aria-label="Tambah Barang" title="Tambah Barang">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- CHIPS -->
      {#if activeFilterChips.length}
        <div class="flex items-center flex-wrap gap-2 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-3 py-2">
          {#each activeFilterChips as chip}
            <span class="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-3 py-1 text-xs font-medium">
              {chip.label}
              <button
                type="button"
                aria-label="Hapus filter"
                class="opacity-70 hover:opacity-100"
                on:click={() => {
                  if (chip.key === 'mitra') mitraFilter = '';
                  if (chip.key === 'sort') sortDir = 'desc';
                  if (chip.key === 'search') search = '';
                  handleFilterOrSearch();
                }}>✕</button>
            </span>
          {/each}
          <button type="button" class="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline" on:click={clearFilters}>Clear</button>
        </div>
      {/if}
    </div>

    <!-- SECTION KONTEN DI BAWAH BAR -->
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      {#if loading}
        {#if activeView === 'table'}
          <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm" role="status" aria-busy="true">
            <div class="overflow-x-auto no-scrollbar">
              <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                <thead class="bg-transparent">
                  <tr>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-20 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-16 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-12 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                  {#each Array(perPage || 10) as _}
                    <tr class="animate-pulse">
                      <!-- Nama Barang -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>
                      <!-- No. Seri -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-40 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>
                      <!-- Mitra -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-44 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>
                      <!-- Aksi -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="flex items-center gap-3">
                          <div class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                          <div class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                          <div class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <div class="border-t border-slate-200/70 dark:border-white/10 px-3 py-3.5">
              <div class="flex items-center justify-between">
                <div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                <div class="flex items-center gap-2">
                  <div class="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                  <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                  <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm" role="status" aria-busy="true">
            <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
              {#each Array(perPage || 10) as _}
                <li class="px-4 py-4 sm:px-6 animate-pulse">
                  <div class="flex items-center justify-between">
                    <div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                  </div>
                  <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div class="h-4 w-72 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
                  </div>
                  <div class="mt-3 flex justify-end gap-2">
                    <div class="h-7 w-16 rounded-lg bg-slate-200/70 dark:bg-white/5"></div>
                    <div class="h-7 w-14 rounded-lg bg-slate-200/70 dark:bg-white/5"></div>
                    <div class="h-7 w-14 rounded-lg bg-slate-200/70 dark:bg-white/5"></div>
                  </div>
                </li>
              {/each}
            </ul>
            <div class="border-t border-slate-200/70 dark:border-white/10 px-3 py-3.5">
              <div class="flex items-center justify-between">
                <div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                <div class="flex items-center gap-2">
                  <div class="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                  <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                  <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      {:else if error}
        <p class="mt-4 text-rose-500">{error}</p>
      {:else if items.length === 0}
        <div class="mt-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
          <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada data.</p>
        </div>
      {:else}
        {#if activeView === 'list'}
          <!-- LIST VIEW -->
          <div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
            <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
              {#each items as item (item.id)}
                <li>
                  <a href={`/barang-certificates/${item.id}`} class="block hover:bg-violet-600/5 dark:hover:bg-white/5 px-4 py-4 sm:px-6">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">{item.name}</p>
                    </div>
                    <div class="mt-2 sm:flex sm:justify-between">
                      <p class="text-sm text-slate-600 dark:text-slate-300">
                        No. Seri: {item.no_seri} | Mitra: {item.mitra?.nama || '-'}
                      </p>
                    </div>
                  </a>

                  <div class="flex justify-end px-4 py-2 sm:px-6 gap-2">
                    <button on:click|stopPropagation={() => openDetailDrawer(item)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700">Detail</button>
                    {#if canUpdateBC}
                      <button on:click|stopPropagation={() => openEditModal(item)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
                    {/if}
                    {#if canDeleteBC}
                      <button on:click|stopPropagation={() => handleDelete(item.id)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>

            {#if items.length > 0}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
                totalItems={totalItems}
                itemsPerPage={perPage}
                perPageOptions={perPageOptions}
                onPerPageChange={(n) => { perPage = n; currentPage = 1; fetchList(); }}
              />
            {/if}
          </div>
        {/if}

        {#if activeView === 'table'}
          <!-- TABLE VIEW -->
          <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
            <div class="overflow-x-auto no-scrollbar">
              <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                <thead>
                  <tr>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Nama Barang</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">No. Seri</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Mitra</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                  {#each items as item (item.id)}
                    <tr>
                      <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        <a href={`/barang-certificates/${item.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{item.name}</a>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{item.no_seri}</td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{item.mitra?.nama || '-'}</td>
                      <td class="relative whitespace-nowrap px-3 py-4 text-sm">
                        <div class="flex items-center gap-2">
                          <button on:click={() => openDetailDrawer(item)} class="text-amber-600 hover:text-amber-700" title="Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span class="sr-only">Detail, {item.name}</span>
                          </button>
                          <button on:click|stopPropagation={() => openEditModal(item)} title="Edit" class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            <span class="sr-only">Edit, {item.name}</span>
                          </button>
                          <button on:click|stopPropagation={() => handleDelete(item.id)} title="Delete" class="text-rose-600 hover:text-rose-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            <span class="sr-only">Hapus, {item.name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            {#if items.length > 0}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
                totalItems={totalItems}
                itemsPerPage={perPage}
                perPageOptions={perPageOptions}
                onPerPageChange={(n) => { perPage = n; currentPage = 1; fetchList(); }}
              />
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </section>
</div>

<!-- ====== MODAL FILTER (MOBILE) ====== -->
{#if showMobileFilter}
  <BarangCertificateFilterMobile
    bind:open={showMobileFilter}
    {mitras}
    mitraValue={mitraFilter}
    sortDir={sortDir}
    on:update={onMobileUpdate}
    on:clear={onMobileClear}
    on:apply={onMobileApply}
    on:close={() => (showMobileFilter = false)}
  />
{/if}

<!-- ====== MODALS / DRAWER ====== -->
<BarangCertificateFormModal
  bind:show={showCreateModal}
  title="Tambah Barang Certificate"
  submitLabel="Simpan"
  idPrefix="create"
  {form}
  {mitras}
  showMitra={true}
  onSubmit={handleSubmitCreate}
/>

{#if editingItem}
  <BarangCertificateFormModal
    bind:show={showEditModal}
    title="Edit Barang Certificate"
    submitLabel="Update"
    idPrefix="edit"
    {form}
    {mitras}
    showMitra={true}
    onSubmit={handleSubmitUpdate}
  />
{/if}

<Drawer bind:show={showDetailDrawer} title="Detail Barang Certificate" on:close={() => (showDetailDrawer = false)}>
  <BarangCertificatesDetail barangCertificates={selectedItem} />
</Drawer>
