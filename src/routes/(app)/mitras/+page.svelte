<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';

  import Drawer from '$lib/components/Drawer.svelte';
  import MitraDetail from '$lib/components/detail/MitraDetail.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import MitraFormModal from '$lib/components/form/MitraFormModal.svelte';

  import MitraFilterDesktop from '$lib/components/filters/MitraFilterDesktop.svelte';
  import MitraFilterMobile from '$lib/components/filters/MitraFilterMobile.svelte';

  // ====== DATA ======
  let mitras: any[] = [];
  let loading = true;
  let error = '';

  // ====== FILTER / QUERY STATE ======
  let search = '';
  // 'pribadi' | 'perusahaan' | 'customer' | 'vendor' | ''
  let kategoriFilter = '';
  let dateFromFilter = '';
  let dateToFilter = '';

  // ====== UI STATE ======
  // view toggle
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

  function applyUpdate(key: 'kategori'|'dateFrom'|'dateTo', value: any) {
    if (key === 'kategori') kategoriFilter = value as string;
    if (key === 'dateFrom') dateFromFilter = value as string;
    if (key === 'dateTo') dateToFilter = value as string;
  }

  // desktop: update + fetch
  function onDesktopUpdate(e: CustomEvent<{key:any, value:any}>) {
    applyUpdate(e.detail.key, e.detail.value);
    handleFilterOrSearch();
  }
  function onDesktopClear() { clearFilters(); }

  // mobile: update state saja, fetch saat Done
  function onMobileUpdate(e: CustomEvent<{key:any, value:any}>) {
    applyUpdate(e.detail.key, e.detail.value);
  }
  function onMobileClear() { clearFilters(); }
  function onMobileApply() {
    showMobileFilter = false;
    handleFilterOrSearch();
  }

  // modal form & drawer
  let showCreateModal = false;
  let showEditModal = false;
  let editingMitra: any = null;
  let showDetailDrawer = false;
  let selectedMitra: any = null;

  // pagination
  let currentPage = 1;
  let lastPage = 1;
  let totalMitras = 0;
  let perPage = 50;
  const perPageOptions = [10, 25, 50, 100];

  // form (create/edit)
  let form = {
    nama: '',
    is_pribadi: false,
    is_perusahaan: false,
    is_customer: false,
    is_vendor: false,
    alamat: '',
    website: '',
    email: '',
    kontak_1: '',
    kontak_1_nama: '',
    kontak_1_jabatan: '',
    kontak_2: '',
    kontak_2_nama: '',
    kontak_2_jabatan: '',
  };

  // options
  const mitraKategoriOptions = ['pribadi','perusahaan','customer','vendor'];

  // ====== HELPERS ======
  function qs(obj: Record<string, any>) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
    });
    return p.toString();
  }

  async function fetchMitras() {
    loading = true; error = '';
    try {
      const url = `/mitras?${qs({
        search,
        kategori: kategoriFilter,
        date_from: dateFromFilter,
        date_to: dateToFilter,
        page: currentPage,
        per_page: perPage
      })}`;

      const res: any = await apiFetch(url, { auth: true });
      mitras       = res?.data ?? res?.items ?? res?.mitras ?? res ?? [];
      currentPage  = res?.pagination?.current_page ?? res?.current_page ?? 1;
      lastPage     = res?.pagination?.last_page   ?? res?.last_page   ?? 1;
      totalMitras  = res?.pagination?.total       ?? res?.total       ?? (Array.isArray(mitras) ? mitras.length : 0);
    } catch (err: any) {
      error = err?.message || 'Gagal memuat mitra.';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!getToken()) { goto('/auth/login'); return; }
    fetchMitras();
  });

  function handleFilterOrSearch() { currentPage = 1; fetchMitras(); }

  function clearFilters() {
    search = '';
    kategoriFilter = '';
    dateFromFilter = '';
    dateToFilter = '';
    currentPage = 1;
    fetchMitras();
  }

  function clearOneFilter(key: 'kategori'|'date') {
    if (key === 'kategori') kategoriFilter = '';
    if (key === 'date') { dateFromFilter = ''; dateToFilter = ''; }
    handleFilterOrSearch();
  }

  function toggleFilter() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      showMobileFilter = true;   // mobile -> drawer
    } else {
      showSidebar = !showSidebar; // desktop -> show/hide sidebar
    }
  }

  function goToPage(page: number) { if (page > 0 && page <= lastPage) { currentPage = page; fetchMitras(); } }

  function openCreateModal() { form = { ...form, nama:'', is_pribadi:false, is_perusahaan:false, is_customer:false, is_vendor:false, alamat:'', website:'', email:'', kontak_1:'', kontak_1_nama:'', kontak_1_jabatan:'', kontak_2:'', kontak_2_nama:'', kontak_2_jabatan:'' }; showCreateModal = true; }
  function openEditModal(mitra: any) { editingMitra = { ...mitra }; form = { ...editingMitra }; showEditModal = true; }
  function openDetailDrawer(mitra: any) { selectedMitra = { ...mitra }; showDetailDrawer = true; }

  async function handleSubmitCreate() {
    try {
      await apiFetch('/mitras', { method: 'POST', body: form, auth: true });
      alert('Mitra berhasil ditambahkan!');
      goto('/mitras'); showCreateModal = false; fetchMitras();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan mitra.'; alert('Error:\n' + msg);
    }
  }
  async function handleSubmitUpdate() {
    if (!editingMitra?.id) return;
    try {
      await apiFetch(`/mitras/${editingMitra.id}`, { method: 'PUT', body: form, auth: true });
      alert('Mitra berhasil diperbarui!');
      goto('/mitras'); showEditModal = false; fetchMitras();
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui mitra.'; alert('Error:\n' + msg);
    }
  }
  async function handleDelete(mitraId: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus mitra ini?')) return;
    try {
      await apiFetch(`/mitras/${mitraId}`, { method: 'DELETE', auth: true });
      alert('Mitra berhasil dihapus!');
      goto('/mitras'); fetchMitras();
    } catch (err: any) {
      alert('Gagal menghapus mitra: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  // --- kunci scroll saat sheet terbuka (mobile filter / drawer / modal) ---
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

  // Chip aktif (atas tabel)
  $: activeFilterChips = [
    kategoriFilter ? { key: 'kategori', label: 'Kategori: ' + (kategoriFilter[0].toUpperCase() + kategoriFilter.slice(1)) } : null,
    (dateFromFilter || dateToFilter)
      ? { key: 'date', label:
          dateFromFilter && dateToFilter
            ? `${new Date(dateFromFilter).toLocaleDateString('id-ID')} - ${new Date(dateToFilter).toLocaleDateString('id-ID')}`
            : (dateFromFilter ? `Dari ${new Date(dateFromFilter).toLocaleDateString('id-ID')}` : `Sampai ${new Date(dateToFilter).toLocaleDateString('id-ID')}`) }
      : null
  ].filter(Boolean) as Array<{key:'kategori'|'date'; label:string}>;
</script>

<svelte:head><title>Daftar Mitra - Indogreen</title></svelte:head>

<!-- ====== GRID 2 KOLOM: SIDEBAR + KONTEN ====== -->
<div class={"grid grid-cols-1 gap-4 " + (showSidebar ? "lg:grid-cols-[260px_minmax(0,1fr)]" : "")}>
  <!-- KIRI: Sidebar filter (desktop, scroll sendiri) -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <aside role="complementary" aria-label="Filter" class={"hidden " + (showSidebar ? "lg:block" : "lg:hidden")}>
    <div class="sticky top-[72px]">
      <div class="max-h-[calc(100dvh-72px-48px)] overflow-y-auto overscroll-contain no-scrollbar [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]">
        <MitraFilterDesktop
          kategoriOptions={mitraKategoriOptions}
          kategoriValue={kategoriFilter}
          dateFrom={dateFromFilter}
          dateTo={dateToFilter}
          on:update={onDesktopUpdate}
          on:clear={onDesktopClear}
        />
      </div>
    </div>
  </aside>

  <!-- KANAN: kolom utama (action bar sticky + chips, konten yang scroll) -->
  <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]">
    <!-- Sticky action bar + chips -->
    <div class="border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10 sticky z-30 top-[60px] sm:top-[72px]">
      <!-- ACTION BAR -->
      <div class="flex items-center gap-2 flex-nowrap bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-2 py-2">
        <!-- kiri: tombol filter + toggle view -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            on:click={toggleFilter}
            class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Filter">
            {#if showSidebar}
              <svg class="w-5 h-5 hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
              <svg class="w-5 h-5 lg:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M6 12h12M10 18h4"/></svg>
            {:else}
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M6 12h12M10 18h4"/></svg>
            {/if}
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

        <!-- kanan: search + tambah -->
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div class="relative flex-1 min-w-0">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-black dark:text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>
            </div>
            <input type="text" placeholder="Cari mitra..." bind:value={search} on:input={handleFilterOrSearch}
              class="block w-full pl-10 pr-3 h-9 rounded-md text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 placeholder-slate-500 dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
          <button
            on:click={openCreateModal}
            class="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 grid place-items-center shrink-0"
            aria-label="Tambah Mitra" title="Tambah Mitra">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </button>
        </div>
      </div>

      <!-- CHIPS -->
      {#if activeFilterChips.length}
        <div class="flex items-center flex-wrap gap-2 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-3 py-2">
          {#each activeFilterChips as chip}
            <span class="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-3 py-1 text-xs font-medium">
              {chip.label}
              <button type="button" aria-label="Hapus filter" class="opacity-70 hover:opacity-100" on:click={() => clearOneFilter(chip.key)}>✕</button>
            </span>
          {/each}
          <button type="button" class="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline" on:click={clearFilters}>Clear</button>
        </div>
      {/if}
    </div>

    <!-- SECTION KONTEN DI BAWAH BAR (scroll sendiri) -->
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      {#if loading}
        <p class="mt-4 text-slate-900 dark:text-slate-100">Memuat mitra...</p>
      {:else if error}
        <p class="mt-4 text-rose-500">{error}</p>
      {:else if mitras.length === 0}
        <div class="mt-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
          <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada mitra.</p>
        </div>
      {:else}
        {#if activeView === 'list'}
          <!-- LIST VIEW -->
          <div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
            <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
              {#each mitras as m (m.id)}
                <li>
                  <a href={`/mitras/${m.id}`} class="block hover:bg-violet-600/5 dark:hover:bg-white/5 px-4 py-4 sm:px-6">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">{m.nama}</p>
                      <div class="ml-2 flex-shrink-0 flex gap-1">
                        {#if m.is_pribadi}<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Pribadi</span>{/if}
                        {#if m.is_perusahaan}<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Perusahaan</span>{/if}
                        {#if m.is_customer}<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Customer</span>{/if}
                        {#if m.is_vendor}<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Vendor</span>{/if}
                      </div>
                    </div>
                    <div class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {m.alamat?.substring(0,100)}{m.alamat?.length>100?'...':''}
                    </div>
                  </a>

                  <div class="flex justify-end px-4 py-2 sm:px-6 gap-2">
                    <button on:click|stopPropagation={() => openDetailDrawer(m)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700">Detail</button>
                    <button on:click|stopPropagation={() => openEditModal(m)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
                    <button on:click|stopPropagation={() => handleDelete(m.id)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
                  </div>
                </li>
              {/each}
            </ul>

            {#if mitras.length > 0}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
                totalItems={totalMitras}
                itemsPerPage={perPage}
                perPageOptions={perPageOptions}
                onPerPageChange={(n) => { perPage = n; currentPage = 1; fetchMitras(); }}
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
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Nama Mitra</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Alamat</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Kategori</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Kontak</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                  {#each mitras as m (m.id)}
                    <tr>
                      <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        <a href={`/mitras/${m.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{m.nama}</a><br>
                        <span class="text-xs text-slate-500 dark:text-slate-400">{m.email || '(email belum ditambahkan)'}</span>
                      </td>
                      <td class="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{m.alamat?.substring(0,40)}{m.alamat?.length>40?'...':''}</td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                        <div class="flex flex-wrap gap-1">
                          {#if m.is_pribadi}<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Pribadi</span>{/if}
                          {#if m.is_perusahaan}<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Perusahaan</span>{/if}
                          {#if m.is_customer}<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Customer</span>{/if}
                          {#if m.is_vendor}<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Vendor</span>{/if}
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {m.kontak_1}{#if m.kontak_1_nama}<br><span class="text-xs text-slate-400">({m.kontak_1_nama})</span>{:else} - {/if}
                      </td>
                      <td class="relative whitespace-nowrap px-3 py-4 text-sm">
                        <div class="flex items-center gap-2">
                          <button on:click={() => openDetailDrawer(m)} class="text-amber-600 hover:text-amber-700" title="Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span class="sr-only">Detail, {m.nama}</span>
                          </button>
                          <button on:click|stopPropagation={() => openEditModal(m)} title="Edit" class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            <span class="sr-only">Edit, {m.nama}</span>
                          </button>
                          <button on:click|stopPropagation={() => handleDelete(m.id)} title="Delete" class="text-rose-600 hover:text-rose-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            <span class="sr-only">Hapus, {m.nama}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            {#if mitras.length > 0}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
                totalItems={totalMitras}
                itemsPerPage={perPage}
                perPageOptions={perPageOptions}
                onPerPageChange={(n) => { perPage = n; currentPage = 1; fetchMitras(); }}
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
  <MitraFilterMobile
    bind:open={showMobileFilter}
    kategoriOptions={mitraKategoriOptions}
    kategoriValue={kategoriFilter}
    dateFrom={dateFromFilter}
    dateTo={dateToFilter}
    on:update={onMobileUpdate}
    on:clear={onMobileClear}
    on:apply={onMobileApply}
    on:close={() => (showMobileFilter = false)}
  />
{/if}

<!-- ====== MODALS / DRAWER ====== -->
<MitraFormModal
  bind:show={showCreateModal}
  title="Tambah Mitra"
  submitLabel="Tambah Mitra"
  idPrefix="create"
  {form}
  onSubmit={handleSubmitCreate}
/>

{#if editingMitra}
  <MitraFormModal
    bind:show={showEditModal}
    title="Edit Mitra"
    submitLabel="Update Mitra"
    idPrefix="edit"
    {form}
    onSubmit={handleSubmitUpdate}
  />
{/if}

<Drawer bind:show={showDetailDrawer} title="Detail Mitra" on:close={() => (showDetailDrawer = false)}>
  <MitraDetail mitra={selectedMitra} />
</Drawer>
