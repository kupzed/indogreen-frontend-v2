<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';

  import Drawer from '$lib/components/Drawer.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import ActivityDetail from '$lib/components/detail/ActivityDetail.svelte';
  import ActivityFormModal from '$lib/components/form/ActivityFormModal.svelte';

  import ActivityFilterDesktop from '$lib/components/filters/ActivityFilterDesktop.svelte';
  import ActivityFilterMobile from '$lib/components/filters/ActivityFilterMobile.svelte';

  // ===== DATA =====
  let activities: any[] = [];
  let projects: any[] = [];
  let vendors: any[] = [];
  let customers: any[] = [];
  let loading = true;
  let error = '';

  // ===== FILTER / QUERY STATE =====
  let search = '';
  let jenisFilter = '';
  let kategoriFilter = '';
  let dateFromFilter = '';
  let dateToFilter = '';
  let sortBy: 'created' | 'activity_date' = 'created';
  let sortDir: 'desc' | 'asc' = 'desc';

  // ===== UI STATE =====
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

  // desktop sidebar & mobile modal
  let showSidebar = true;
  let showMobileFilter = false;

  // modal & drawer
  let showCreateModal = false;
  let showEditModal = false;
  let editingActivity: any = null;

  let showDetailDrawer = false;
  let selectedActivity: any = null;

  // pagination
  let currentPage = 1;
  let lastPage = 1;
  let totalActivities = 0;
  let perPage = 50;
  const perPageOptions = [10, 25, 50, 100];

  // form state (ringkas — form lengkap di ActivityFormModal)
  let form: any = {
    name: '',
    short_desc: '',
    description: '',
    project_id: '',
    kategori: '',
    activity_date: '',
    jenis: '',
    mitra_id: null,
    from: '',
    to: '',
    attachments: [],
    attachment_names: [],
    attachment_descriptions: [],
    existing_attachments: [],
    removed_existing_ids: []
  };

  // options
  const activityKategoriList = [
    'Expense Report','Invoice','Purchase Order','Payment','Quotation',
    'Faktur Pajak','Kasbon','Laporan Teknis','Surat Masuk','Surat Keluar',
    'Kontrak', 'Berita Acara', 'Receive Item', 'Other',
  ];
  const activityJenisList = ['Internal','Customer','Vendor'];

  // ===== HELPERS =====
  function qs(obj: Record<string, any>) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
    });
    return p.toString();
  }

  // ===== API =====
  async function fetchActivities() {
    loading = true; error = '';
    try {
      const url = `/activities?${qs({
        search,
        jenis: jenisFilter,
        kategori: kategoriFilter,
        date_from: dateFromFilter,
        date_to: dateToFilter,
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_dir: sortDir
      })}`;
      const res: any = await apiFetch(url, { auth: true });
      activities       = res?.data ?? res?.items ?? res ?? [];
      currentPage      = res?.pagination?.current_page ?? res?.current_page ?? 1;
      lastPage         = res?.pagination?.last_page   ?? res?.last_page   ?? 1;
      totalActivities  = res?.pagination?.total       ?? res?.total       ?? (Array.isArray(activities) ? activities.length : 0);
    } catch (err: any) {
      error = err?.message || 'Gagal memuat aktivitas.';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function fetchFormDependencies() {
    try {
      const dep: any = await apiFetch('/activity/getFormDependencies', { auth: true });
      projects = dep?.projects ?? dep?.data?.projects ?? [];
      vendors  = dep?.vendors  ?? dep?.data?.vendors  ?? [];

      try {
        const cust: any = await apiFetch('/mitra/customers', { auth: true });
        customers = cust?.data ?? cust ?? [];
      } catch (e) {
        customers = [];
        console.warn('Fetch customers (optional) gagal:', e);
      }
    } catch (err) {
      console.error('Failed to fetch dependencies:', err);
    }
  }

  onMount(() => {
    if (!getToken()) { goto('/auth/login'); return; }
    fetchActivities();
    fetchFormDependencies();
  });

  function handleFilterOrSearch() { currentPage = 1; fetchActivities(); }
  function clearFilters() {
    search = '';
    jenisFilter = '';
    kategoriFilter = '';
    dateFromFilter = '';
    dateToFilter = '';
    sortBy = 'created';
    sortDir = 'desc';
    currentPage = 1;
    search = '';
    fetchActivities();
  }
  function clearOneFilter(key: 'jenis'|'kategori'|'date'|'sort'|'search') {
    if (key === 'jenis') jenisFilter = '';
    if (key === 'kategori') kategoriFilter = '';
    if (key === 'date') { dateFromFilter = ''; dateToFilter = ''; }
    if (key === 'sort') { sortBy = 'created'; sortDir = 'desc'; }
    if (key === 'search') search = '';
    handleFilterOrSearch();
  }

  function toggleFilter() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      showMobileFilter = true;
    } else {
      showSidebar = !showSidebar;
    }
  }

  function goToPage(page: number) { if (page > 0 && page <= lastPage) { currentPage = page; fetchActivities(); } }

  function openCreateModal() {
    form = {
      name: '', short_desc: '', description: '', project_id: '', kategori: '',
      activity_date: '', jenis: '', mitra_id: null, from: '', to: '',
      attachments: [], attachment_names: [], attachment_descriptions: [],
      existing_attachments: [], removed_existing_ids: []
    };
    showCreateModal = true;
  }
  function openEditModal(a: any) {
    editingActivity = { ...a };
    form = {
      name: a.name ?? '',
      short_desc: a.short_desc ?? '',
      description: a.description ?? '',
      project_id: a.project_id ?? '',
      kategori: a.kategori ?? '',
      activity_date: a.activity_date ? new Date(a.activity_date).toISOString().split('T')[0] : '',
      jenis: a.jenis ?? '',
      mitra_id: a.mitra_id ?? '',
      from: a.from ?? '',
      to: a.to ?? '',
      attachments: [],
      attachment_names: [],
      attachment_descriptions: [],
      existing_attachments: Array.isArray(a.attachments)
        ? a.attachments.map((x: any) => ({
            id: x.id,
            name: x.name ?? x.file_name ?? 'Lampiran',
            description: x.description ?? '',
            original_name: x.original_name ?? x.file_name ?? x.name ?? '',
            url: x.url ?? x.path ?? x.file_path,
            size: x.size
          }))
        : [],
      removed_existing_ids: []
    };
    showEditModal = true;
  }
  function openDetailDrawer(a: any) { selectedActivity = { ...a }; showDetailDrawer = true; }

  // FormData builder
  function appendScalar(fd: FormData, key: string, val: any) {
    if (val === null || val === undefined || val === '') return;
    fd.append(key, String(val));
  }
  function buildFormDataForActivity() {
    const fd = new FormData();
    appendScalar(fd, 'name', form.name);
    appendScalar(fd, 'short_desc', form.short_desc);
    appendScalar(fd, 'description', form.description);
    appendScalar(fd, 'project_id', form.project_id);
    appendScalar(fd, 'kategori', form.kategori);
    appendScalar(fd, 'activity_date', form.activity_date);
    appendScalar(fd, 'jenis', form.jenis);
    appendScalar(fd, 'from', form.from);
    appendScalar(fd, 'to', form.to);

    // mitra_id sesuai jenis
    if (form.jenis === 'Internal') {
      fd.set('mitra_id', '1');
    } else if (form.jenis === 'Customer') {
      const p = projects.find((x) => x.id == form.project_id);
      if (p?.mitra_id) fd.set('mitra_id', String(p.mitra_id));
    } else if (form.jenis === 'Vendor' && form.mitra_id) {
      fd.set('mitra_id', String(form.mitra_id));
    }

    (form.attachments || []).forEach((file: File, i: number) => fd.append(`attachments[${i}]`, file));
    (form.attachment_names || []).forEach((n: string, i: number) => fd.append(`attachment_names[${i}]`, n ?? ''));
    (form.attachment_descriptions || []).forEach((d: string, i: number) => fd.append(`attachment_descriptions[${i}]`, d ?? ''));

    (form.existing_attachments || []).forEach((att: any, i: number) => {
      fd.append(`existing_attachment_ids[${i}]`, String(att.id));
      fd.append(`existing_attachment_names[${i}]`, att.name ?? '');
      fd.append(`existing_attachment_descriptions[${i}]`, att.description ?? '');
    });
    (form.removed_existing_ids || []).forEach((id: number) => fd.append('removed_existing_ids[]', String(id)));

    return fd;
  }

  async function handleSubmitCreate() {
    try {
      const fd = buildFormDataForActivity();
      await apiFetch('/activities', { method: 'POST', body: fd, auth: true });
      alert('Aktivitas berhasil ditambahkan!');
      goto('/activities'); showCreateModal = false; fetchActivities();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan aktivitas.'; alert('Error:\n' + msg);
    }
  }
  async function handleSubmitUpdate() {
    if (!editingActivity?.id) return;
    try {
      const fd = buildFormDataForActivity();
      fd.append('_method', 'PUT');
      await apiFetch(`/activities/${editingActivity.id}`, { method: 'POST', body: fd, auth: true });
      alert('Aktivitas berhasil diperbarui!');
      goto('/activities'); showEditModal = false; fetchActivities();
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui aktivitas.'; alert('Error:\n' + msg);
    }
  }
  async function handleDelete(id: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) return;
    try {
      await apiFetch(`/activities/${id}`, { method: 'DELETE', auth: true });
      alert('Aktivitas berhasil dihapus!');
      goto('/activities'); fetchActivities();
    } catch (err: any) {
      alert('Gagal menghapus aktivitas: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  // --- lock body scroll saat overlay terbuka ---
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

  // ===== CHIPS =====
  $: activeFilterChips = [
    jenisFilter ? { key: 'jenis' as const, label: jenisFilter } : null,
    kategoriFilter ? { key: 'kategori' as const, label: kategoriFilter } : null,
    (dateFromFilter || dateToFilter)
      ? {
          key: 'date' as const,
          label:
            dateFromFilter && dateToFilter
            ? `${new Date(dateFromFilter).toLocaleDateString('id-ID')} - ${new Date(dateToFilter).toLocaleDateString('id-ID')}`
            : (dateFromFilter ? `Dari ${new Date(dateFromFilter).toLocaleDateString('id-ID')}` : `Sampai ${new Date(dateToFilter).toLocaleDateString('id-ID')}`)
        }
      : null,
    (sortBy === 'activity_date')
      ? { key: 'sort' as const, label: `Urut: Dilaksanakan ${sortDir === 'desc' ? 'Terbaru dulu' : 'Terlama dulu'}` }
      : (sortBy === 'created' && sortDir === 'asc'
          ? { key: 'sort' as const, label: 'Urut: Create Terlama' }
          : null),
    search && { key:'search', label:`Cari: ${search}` },
  ].filter(Boolean) as Array<{key:'jenis'|'kategori'|'date'|'sort'|'search'; label:string}>;

</script>

<svelte:head><title>Daftar Activity - Indogreen</title></svelte:head>

<!-- ===== GRID 2 KOLOM ===== -->
<div class={"grid grid-cols-1 gap-4 " + (showSidebar ? "lg:grid-cols-[260px_minmax(0,1fr)]" : "")}>
  <!-- SIDEBAR FILTER (desktop) -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <aside role="complementary" aria-label="Filter" class={"hidden " + (showSidebar ? "lg:block" : "lg:hidden")}>
    <div class="sticky top-[72px]">
      <div class="max-h-[calc(100dvh-72px-48px)] overflow-y-auto overscroll-contain no-scrollbar [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]">
        <ActivityFilterDesktop
          jenisOptions={activityJenisList}
          kategoriOptions={activityKategoriList}
          jenisValue={jenisFilter}
          kategoriValue={kategoriFilter}
          dateFrom={dateFromFilter}
          dateTo={dateToFilter}
          sortBy={sortBy}
          sortDir={sortDir}
          on:update={(e) => {
            const { key, value } = e.detail;
            if (key === 'jenis') jenisFilter = value;
            if (key === 'kategori') kategoriFilter = value;
            if (key === 'dateFrom') dateFromFilter = value;
            if (key === 'dateTo') dateToFilter = value;

            if (key === 'sortBy') sortBy = value;
            if (key === 'sortDir') sortDir = value;

            handleFilterOrSearch();
          }}
          on:clear={() => clearFilters()}
        />
      </div>
    </div>
  </aside>

  <!-- KANAN: KONTEN -->
  <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]">
    <!-- STICKY ACTION BAR + CHIPS -->
    <div class="border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10 sticky z-30 top-[60px] sm:top-[72px]">
      <!-- ACTION BAR -->
      <div class="flex items-center gap-2 flex-nowrap bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-2 py-2">
        <!-- kiri: filter + view toggle -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            on:click={toggleFilter}
            class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm
                   border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70
                   text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Filter"
          >
            {#if showSidebar}
              <svg class="w-5 h-5 hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
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

        <!-- kanan: search + tambah -->
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div class="relative flex-1 min-w-0">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-black dark:text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>
            </div>
            <input type="text" placeholder="Cari aktivitas..." bind:value={search} on:input={handleFilterOrSearch}
              class="block w-full pl-10 pr-3 h-9 rounded-md text-sm border border-black/5 dark:border-white/10
                     bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 placeholder-slate-500
                     dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
          <button
            on:click={openCreateModal}
            class="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 grid place-items-center shrink-0"
            aria-label="Tambah Aktivitas" title="Tambah Aktivitas">
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

    <!-- KONTEN -->
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      {#if loading}
        {#if activeView === 'table'}
          <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm" role="status" aria-busy="true">
            <div class="relative overflow-x-auto no-scrollbar">
              <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                <thead class="bg-transparent">
                  <tr>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-24 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-20 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-16 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-16 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-18 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                    <th class="px-3 py-3.5 text-left"><div class="h-4 w-12 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                  {#each Array(perPage || 10) as _}
                    <tr class="animate-pulse">
                      <!-- Nama Aktivitas + deskripsi -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                        <div class="mt-2 h-3 w-40 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
                      </td>
                      <!-- Project -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-44 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>
                      <!-- Kategori (badge) -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <span class="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5 block"></span>
                      </td>
                      <!-- Jenis -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-24 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>
                      <!-- Mitra -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-36 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>
                      <!-- Tanggal -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
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
                    <span class="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5"></span>
                  </div>
                  <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div class="h-4 w-72 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
                    <div class="h-4 w-40 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
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
      {:else if activities.length === 0}
        <div class="mt-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
          <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada aktivitas.</p>
        </div>
      {:else}
        {#if activeView === 'list'}
          <div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
            <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
              {#each activities as activity (activity.id)}
                <li>
                  <a href={`/activities/${activity.id}`} class="block hover:bg-violet-600/5 dark:hover:bg-white/5 px-4 py-4 sm:px-6">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">{activity.name}</p>
                      <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300">{activity.kategori}</span>
                    </div>
                    <div class="mt-2 sm:flex sm:justify-between">
                      <p class="text-sm text-slate-600 dark:text-slate-300">
                        Project: {activity.project?.name || '-'} | Jenis: {activity.jenis}
                        {#if (activity.jenis === 'Vendor' || activity.jenis === 'Customer') && activity.mitra}
                          | {activity.jenis}: {activity.mitra.nama}
                        {/if}
                        | {activity.description?.substring(0, 60) || ''}{activity.description?.length > 60 ? '...' : ''}
                      </p>
                      <p class="mt-2 sm:mt-0 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                        {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </a>
                  <div class="flex justify-end px-4 py-2 sm:px-6 gap-2">
                    <button on:click|stopPropagation={() => openDetailDrawer(activity)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700">Detail</button>
                    <button on:click|stopPropagation={() => openEditModal(activity)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
                    <button on:click|stopPropagation={() => handleDelete(activity.id)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
                  </div>
                </li>
              {/each}
            </ul>
            {#if activities.length > 0}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
                totalItems={totalActivities}
                itemsPerPage={perPage}
                perPageOptions={perPageOptions}
                onPerPageChange={(n) => { perPage = n; currentPage = 1; fetchActivities(); }}
              />
            {/if}
          </div>
        {/if}

        {#if activeView === 'table'}
          <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
            <div class="relative overflow-x-auto no-scrollbar">
              <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                <thead>
                  <tr>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Nama Aktivitas</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Project</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Kategori</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Jenis</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Mitra</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Tanggal</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                  {#each activities as a (a.id)}
                    <tr>
                      <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        <a href={`/activities/${a.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{a.name}</a><br>
                        <span class="text-xs text-slate-500 dark:text-slate-400">{a.short_desc}</span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {a.project?.name?.substring(0, 25) || '-'}{a.project?.name?.length > 25 ? '...' : ''}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm">
                        <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300">{a.kategori}</span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{a.jenis}</td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {#if (a.jenis === 'Vendor' || a.jenis === 'Customer') && a.mitra}
                          {a.mitra?.nama?.substring(0, 25)}{a.mitra?.nama?.length > 25 ? '...' : ''}
                        {:else}-{/if}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(a.activity_date).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm">
                        <div class="flex items-center gap-2">
                          <button on:click={() => openDetailDrawer(a)} class="text-amber-600 hover:text-amber-700" title="Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            <span class="sr-only">Detail, {a.name}</span>
                          </button>
                          <button on:click|stopPropagation={() => openEditModal(a)} title="Edit" class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            <span class="sr-only">Edit, {a.name}</span>
                          </button>
                          <button on:click|stopPropagation={() => handleDelete(a.id)} title="Delete" class="text-rose-600 hover:text-rose-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            <span class="sr-only">Hapus, {a.name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            {#if activities.length > 0}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
                totalItems={totalActivities}
                itemsPerPage={perPage}
                perPageOptions={perPageOptions}
                onPerPageChange={(n) => { perPage = n; currentPage = 1; fetchActivities(); }}
              />
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </section>
</div>

<!-- ===== MOBILE FILTER ===== -->
{#if showMobileFilter}
  <ActivityFilterMobile
    bind:open={showMobileFilter}
    jenisOptions={activityJenisList}
    kategoriOptions={activityKategoriList}
    jenisValue={jenisFilter}
    kategoriValue={kategoriFilter}
    dateFrom={dateFromFilter}
    dateTo={dateToFilter}
    sortBy={sortBy}
    sortDir={sortDir}
    on:update={(e) => {
      const { key, value } = e.detail;
      if (key === 'jenis') jenisFilter = value;
      if (key === 'kategori') kategoriFilter = value;
      if (key === 'dateFrom') dateFromFilter = value;
      if (key === 'dateTo') dateToFilter = value;

      // ✅ listen to sorting updates
      if (key === 'sortBy') sortBy = value;
      if (key === 'sortDir') sortDir = value;
    }}
    on:clear={() => clearFilters()}
    on:apply={() => { showMobileFilter = false; handleFilterOrSearch(); }}
    on:close={() => (showMobileFilter = false)}
  />
{/if}

<!-- ===== MODALS / DRAWER ===== -->
<ActivityFormModal
  bind:show={showCreateModal}
  title="Form Aktivitas Baru"
  submitLabel="Tambah Aktivitas"
  idPrefix="create"
  {form}
  {projects}
  {vendors}
  allowRemoveAttachment={false}
  onSubmit={handleSubmitCreate}
/>

{#if editingActivity}
  <ActivityFormModal
    bind:show={showEditModal}
    title="Edit Aktivitas"
    submitLabel="Update Aktivitas"
    idPrefix="edit"
    {form}
    {projects}
    {vendors}
    allowRemoveAttachment={true}
    onSubmit={handleSubmitUpdate}
  />
{/if}

<Drawer bind:show={showDetailDrawer} title="Detail Activity" on:close={() => (showDetailDrawer = false)}>
  <ActivityDetail activity={selectedActivity} />
</Drawer>
