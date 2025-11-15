<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';
  import Drawer from '$lib/components/Drawer.svelte';
  import ProjectDetail from '$lib/components/detail/ProjectDetail.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import ProjectFormModal from '$lib/components/form/ProjectFormModal.svelte';
  import ProjectFilterDesktop from '$lib/components/filters/ProjectFilterDesktop.svelte';
  import ProjectFilterMobile from '$lib/components/filters/ProjectFilterMobile.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

  // ====== DATA ======
  let projects: any[] = [];
  let customers: any[] = [];
  let loading = true;
  let error = '';

  // ====== FILTER / QUERY STATE ======
  let search = '';
  let statusFilter = '';
  let kategoriFilter = '';
  let certProjectFilter = false;
  let dateFromFilter = '';
  let dateToFilter = '';

  // NEW: kontrol sorting (sesuai baseline)
  let sortBy: 'created' | 'start_date' = 'created';
  let sortDir: 'desc' | 'asc' = 'desc';

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

  // ====== CONFIRM DELETE STATE ======
  let showConfirmDelete = false;
  let confirmPending = false;
  let targetProject: any = null;

  function openConfirmDelete(p: any) {
    targetProject = p;
    showConfirmDelete = true;
  }

  function onCancelDelete() {
    showConfirmDelete = false;
    targetProject = null;
  }


  // sidebar & mobile modal
  let showSidebar = true;        // desktop toggle
  let showMobileFilter = false;  // mobile modal

  function applyUpdate(
    key: 'status' | 'kategori' | 'cert' | 'dateFrom' | 'dateTo' | 'sortBy' | 'sortDir',
    value: any
  ) {
    if (key === 'status') statusFilter = value as string;
    if (key === 'kategori') kategoriFilter = value as string;
    if (key === 'cert') certProjectFilter = Boolean(value);
    if (key === 'dateFrom') dateFromFilter = value as string;
    if (key === 'dateTo') dateToFilter = value as string;
    if (key === 'sortBy') sortBy = value as 'created' | 'start_date';
    if (key === 'sortDir') sortDir = value as 'desc' | 'asc';
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
  let editingProject: any = null;
  let showDetailDrawer = false;
  let selectedProject: any = null;

  // pagination
  let currentPage = 1;
  let lastPage = 1;
  let totalProjects = 0;
  let perPage = 50;
  const perPageOptions = [10, 25, 50, 100];

  // form
  let form = {
    name: '', description: '', status: '', start_date: '', finish_date: '',
    mitra_id: '', kategori: '', lokasi: '', no_po: '', no_so: '', is_cert_projects: false,
  };

  // options
  const projectStatuses = ['Ongoing', 'Prospect', 'Complete', 'Cancel'];
  const projectKategoris = [
    'PLTS Hybrid','PLTS Ongrid','PLTS Offgrid','PJUTS All In One','PJUTS Two In One','PJUTS Konvensional'
  ];

  // ====== HELPERS ======
  function qs(obj: Record<string, any>) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
    });
    return p.toString();
  }

  async function fetchProjects() {
    loading = true; error = '';
    try {
      const url = `/projects?${qs({
        search,
        status: statusFilter,
        kategori: kategoriFilter,
        is_cert_projects: certProjectFilter ? 1 : '',
        date_from: dateFromFilter,
        date_to: dateToFilter,
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_dir: sortDir
      })}`;

      const res: any = await apiFetch(url, { auth: true });
      projects      = res?.data ?? res?.items ?? res?.projects ?? res ?? [];
      currentPage   = res?.pagination?.current_page ?? res?.current_page ?? 1;
      lastPage      = res?.pagination?.last_page   ?? res?.last_page   ?? 1;
      totalProjects = res?.pagination?.total       ?? res?.total       ?? (Array.isArray(projects) ? projects.length : 0);
    } catch (err: any) {
      error = err?.message || 'Gagal memuat project.';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function fetchCustomers() {
    try {
      const res: any = await apiFetch('/mitra/customers', { auth: true });
      customers = res?.data ?? res ?? [];
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  }

  onMount(() => {
    if (!getToken()) { goto('/auth/login'); return; }
    fetchProjects();
    fetchCustomers();
  });

  function handleFilterOrSearch() { currentPage = 1; fetchProjects(); }

  function clearFilters() {
    search = '';
    statusFilter = '';
    kategoriFilter = '';
    certProjectFilter = false;
    dateFromFilter = '';
    dateToFilter = '';
    sortBy = 'created';
    sortDir = 'desc';
    search = '';
    currentPage = 1;
    fetchProjects();
  }

  function clearOneFilter(key: 'status'|'kategori'|'cert'|'date'|'sort'|'search') {
    if (key === 'status') statusFilter = '';
    if (key === 'kategori') kategoriFilter = '';
    if (key === 'cert') certProjectFilter = false;
    if (key === 'date') { dateFromFilter = ''; dateToFilter = ''; }
    if (key === 'sort') { sortBy = 'created'; sortDir = 'desc'; }
    if (key === 'search') search = '';
    handleFilterOrSearch();
  }

  function toggleFilter() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      showMobileFilter = true;   // mobile -> modal
    } else {
      showSidebar = !showSidebar; // desktop -> show/hide sidebar
    }
  }

  function goToPage(page: number) { if (page > 0 && page <= lastPage) { currentPage = page; fetchProjects(); } }

  function openCreateModal() {
    form = { name:'', description:'', status:'', start_date:'', finish_date:'', mitra_id:'', kategori:'', lokasi:'', no_po:'', no_so:'', is_cert_projects:false };
    showCreateModal = true;
  }
  function openEditModal(project: any) {
    editingProject = { ...project };
    form = { ...editingProject, mitra_id: editingProject.mitra_id || '', is_cert_projects: !!editingProject.is_cert_projects };
    showEditModal = true;
  }
  function openDetailDrawer(project: any) { selectedProject = { ...project }; showDetailDrawer = true; }

  async function handleSubmitCreate() {
    try {
      await apiFetch('/projects', { method: 'POST', body: form, auth: true });
      alert('Project berhasil ditambahkan!');
      goto('/projects'); showCreateModal = false; fetchProjects();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan project.'; alert('Error:\n' + msg);
    }
  }

  async function handleSubmitUpdate() {
    if (!editingProject?.id) return;
    try {
      await apiFetch(`/projects/${editingProject.id}`, { method: 'PUT', body: form, auth: true });
      alert('Project berhasil diperbarui!');
      goto('/projects'); showEditModal = false; fetchProjects();
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui project.'; alert('Error:\n' + msg);
    }
  }

  async function handleDelete(projectId: number) {
    confirmPending = true;
    try {
      await apiFetch(`/projects/${projectId}`, { method: 'DELETE', auth: true });
      showConfirmDelete = false;
      targetProject = null;
      alert('Project berhasil dihapus!');
      fetchProjects();
    } catch (err: any) {
      alert('Gagal menghapus project: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      confirmPending = false;
    }
  }

  function onConfirmDelete() {
    if (!targetProject?.id) return;
    handleDelete(targetProject.id);
  }

  // --- kunci scroll saat drawer filter mobile terbuka ---
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

  // Badge (selaras Dashboard)
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Complete':
      case 'Aktif':
        return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300';
      case 'Ongoing':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-300';
      case 'Prospect':
      case 'Belum':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-300';
      case 'Cancel':
      case 'Tidak Aktif':
        return 'bg-rose-500/20 text-rose-600 dark:text-rose-300';
      default:
        return 'bg-slate-500/20 text-slate-600 dark:text-slate-300';
    }
  }

  // 🔁 ganti reaktif chips jadi include chip sorting
  $: activeFilterChips = [
    statusFilter ? { key: 'status', label: statusFilter } : null,
    kategoriFilter ? { key: 'kategori', label: kategoriFilter } : null,
    certProjectFilter ? { key: 'cert', label: 'Certificate' } : null,
    (dateFromFilter || dateToFilter)
      ? { key: 'date', label:
          dateFromFilter && dateToFilter
            ? `${new Date(dateFromFilter).toLocaleDateString('id-ID')} - ${new Date(dateToFilter).toLocaleDateString('id-ID')}`
            : (dateFromFilter ? `Dari ${new Date(dateFromFilter).toLocaleDateString('id-ID')}` : `Sampai ${new Date(dateToFilter).toLocaleDateString('id-ID')}`) }
      : null,
    (sortBy === 'start_date')
      ? { key: 'sort', label: `Urut: Dilaksanakan ${sortDir === 'desc' ? 'Terbaru dulu' : 'Terlama dulu'}` }
      : (sortDir === 'asc' ? { key: 'sort', label: 'Urut: Create Terlama' } : null),
    search && { key: 'search', label: `Cari: ${search}` },
  ].filter(Boolean) as Array<{key:'status'|'kategori'|'cert'|'date'|'sort'|'search'; label:string}>;
</script>

<svelte:head><title>Daftar Project - Indogreen</title></svelte:head>

<!-- ====== GRID 2 KOLOM: SIDEBAR + KONTEN ====== -->
<div class={"grid grid-cols-1 gap-4 " + (showSidebar ? "lg:grid-cols-[260px_minmax(0,1fr)]" : "")}>
  <!-- KIRI: Sidebar filter (muncul hanya saat showSidebar true) -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <aside
    role="complementary"
    aria-label="Filter"
    class={"hidden " + (showSidebar ? "lg:block" : "lg:hidden")}
  >
    <!-- Tetap melekat di bawah navbar -->
    <div class="sticky top-[72px]">
      <!-- Tinggi kolom = tinggi viewport - navbar(72) - padding main(48) -->
      <div class="max-h-[calc(100dvh-72px-48px)] overflow-y-auto overscroll-contain no-scrollbar [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]">
        <ProjectFilterDesktop
          statusOptions={projectStatuses}
          kategoriOptions={projectKategoris}
          statusValue={statusFilter}
          kategoriValue={kategoriFilter}
          certValue={certProjectFilter}
          dateFrom={dateFromFilter}
          dateTo={dateToFilter}
          sortBy={sortBy}
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
      <div class="flex items-center gap-2 flex-nowrap
                  bg-white/70 dark:bg-[#12101d]/70 backdrop-blur
                  px-2 py-2">
        <!-- Kiri: Filter + toggle view -->
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
              <svg class="w-5 h-5 hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
              </svg>

              <svg class="w-5 h-5 lg:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6h16M6 12h12M10 18h4"/>
              </svg>

            {:else}
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6h16M6 12h12M10 18h4"/>
              </svg>
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
            <input type="text" placeholder="Cari project..." bind:value={search} on:input={handleFilterOrSearch}
              class="block w-full pl-10 pr-3 h-9 rounded-md text-sm border border-black/5 dark:border-white/10
                     bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 placeholder-slate-500
                     dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
          <button
            on:click={openCreateModal}
            class="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 grid place-items-center shrink-0"
            aria-label="Tambah Project" title="Tambah Project">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
      <!-- CHIPS -->
      {#if activeFilterChips.length}
        <div class="flex items-center flex-wrap gap-2
                    bg-white/70 dark:bg-[#12101d]/70 backdrop-blur
                    px-3 py-2">
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

    <!-- SECTION KONTEN DI BAWAH BAR -->
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      {#if loading}
        {#if activeView === 'table'}
          <!-- TABLE SKELETON -->
          <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm" role="status" aria-busy="true">
            <div class="overflow-x-auto no-scrollbar">
              <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                <!-- Pakai kelas sticky yang sama dengan versi nyata thead kamu -->
                <thead class="bg-transparent">
                  <tr>
                    <th class="px-3 py-3.5 text-left">
                      <div class="h-4 w-32 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                    </th>
                    <th class="px-3 py-3.5 text-left">
                      <div class="h-4 w-24 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                    </th>
                    <th class="px-3 py-3.5 text-left">
                      <div class="h-4 w-12 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                    </th>
                    <th class="px-3 py-3.5 text-left">
                      <div class="h-4 w-20 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                    </th>
                    <th class="px-3 py-3.5 text-left">
                      <div class="h-4 w-16 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                    </th>
                    <th class="px-3 py-3.5 text-left">
                      <div class="h-4 w-24 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                    </th>
                    <th class="px-3 py-3.5 text-left">
                      <div class="h-4 w-14 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                    </th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                  {#each Array(perPage || 10) as _}
                    <tr class="animate-pulse">
                      <!-- Nama Project + customer -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                        <div class="mt-2 h-3 w-32 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
                      </td>

                      <!-- Lokasi -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>

                      <!-- Tahun -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-10 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>

                      <!-- Kategori -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="h-4 w-24 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                      </td>

                      <!-- Status + badge certificate -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="flex items-center gap-2">
                          <span class="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5"></span>
                          <span class="h-5 w-16 rounded-full bg-slate-200/50 dark:bg-white/5"></span>
                        </div>
                      </td>

                      <!-- Dilaksanakan (start/finish) -->
                      <td class="whitespace-nowrap px-3 py-4">
                        <div class="space-y-1">
                          <div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                          <div class="h-4 w-24 rounded-md bg-slate-200/50 dark:bg-white/5"></div>
                        </div>
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

            <!-- Pagination skeleton (biar tinggi area bawah stabil) -->
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
      {:else if projects.length === 0}
        <div class="mt-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
          <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada project.</p>
        </div>
      {:else}
        {#if activeView === 'list'}
          <!-- LIST VIEW -->
          <div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
            <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
              {#each projects as project (project.id)}
                <li>
                  <a href={`/projects/${project.id}`} class="block hover:bg-violet-600/5 dark:hover:bg-white/5 px-4 py-4 sm:px-6">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">{project.name}</p>
                      <div class="ml-2 flex-shrink-0 flex gap-2">
                        <span class={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " + getStatusBadgeClasses(project.status)}>{project.status}</span>
                        {#if project.is_cert_projects}
                          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Certificate</span>
                        {/if}
                      </div>
                    </div>
                    <div class="mt-2 sm:flex sm:justify-between">
                      <p class="text-sm text-slate-600 dark:text-slate-300">
                        Customer: {project.mitra?.nama || '-'} | Deskripsi: {project.description?.substring(0,50) || ''}{project.description?.length > 50 ? '...' : ''}
                      </p>
                      <p class="mt-2 sm:mt-0 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                        Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </a>

                  <div class="flex justify-end px-4 py-2 sm:px-6 gap-2">
                    <button on:click|stopPropagation={() => openDetailDrawer(project)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700">Detail</button>
                    <button on:click|stopPropagation={() => openEditModal(project)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
                    <button on:click|stopPropagation={() => openConfirmDelete(project.id)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
                  </div>
                </li>
              {/each}
            </ul>

            {#if projects.length > 0}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
                totalItems={totalProjects}
                itemsPerPage={perPage}
                perPageOptions={perPageOptions}
                onPerPageChange={(n) => { perPage = n; currentPage = 1; fetchProjects(); }}
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
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Nama Project</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Lokasi</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Tahun</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Kategori</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Status</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Dilaksanakan</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                  {#each projects as project (project.id)}
                    <tr>
                      <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        <a href={`/projects/${project.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{project.name}</a><br>
                        <span class="text-xs text-slate-500 dark:text-slate-400">{project.mitra?.nama}</span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {project.lokasi?.substring(0, 40)}{project.lokasi?.length > 40 ? '...' : ''}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(project.start_date).toLocaleDateString('id-ID', { year: 'numeric' })}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{project.kategori || '-'}</td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm">
                        <div class="flex items-center gap-2">
                          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold {getStatusBadgeClasses(project.status)}">{project.status}</span>
                          {#if project.is_cert_projects}
                            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Certificate</span>
                          {/if}
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}<br>
                        {#if project.finish_date}
                          {new Date(project.finish_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {:else}-{/if}
                      </td>
                      <td class="relative whitespace-nowrap px-3 py-4 text-sm">
                        <div class="flex items-center gap-2">
                          <button on:click={() => openDetailDrawer(project)} class="text-amber-600 hover:text-amber-700" title="Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span class="sr-only">Detail, {project.name}</span>
                          </button>
                          <button on:click|stopPropagation={() => openEditModal(project)} title="Edit" class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            <span class="sr-only">Edit, {project.name}</span>
                          </button>
                          <button on:click|stopPropagation={() => openConfirmDelete(project.id)} title="Delete" class="text-rose-600 hover:text-rose-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            <span class="sr-only">Hapus, {project.name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            {#if projects.length > 0}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
                totalItems={totalProjects}
                itemsPerPage={perPage}
                perPageOptions={perPageOptions}
                onPerPageChange={(n) => { perPage = n; currentPage = 1; fetchProjects(); }}
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
  <ProjectFilterMobile
    bind:open={showMobileFilter}
    statusOptions={projectStatuses}
    kategoriOptions={projectKategoris}
    statusValue={statusFilter}
    kategoriValue={kategoriFilter}
    certValue={certProjectFilter}
    dateFrom={dateFromFilter}
    dateTo={dateToFilter}
    sortBy={sortBy}
    sortDir={sortDir}
    on:update={onMobileUpdate}
    on:clear={onMobileClear}
    on:apply={onMobileApply}
    on:close={() => (showMobileFilter = false)}
  />
{/if}

<!-- ====== MODALS / DRAWER ====== -->
<ProjectFormModal
  bind:show={showCreateModal}
  title="Form Project Baru"
  submitLabel="Tambah Project"
  idPrefix="create"
  {form}
  {customers}
  {projectStatuses}
  {projectKategoris}
  onSubmit={handleSubmitCreate}
/>

{#if editingProject}
  <ProjectFormModal
    bind:show={showEditModal}
    title="Edit Project"
    submitLabel="Update Project"
    idPrefix="edit"
    {form}
    {customers}
    {projectStatuses}
    {projectKategoris}
    onSubmit={handleSubmitUpdate}
  />
{/if}

<Drawer bind:show={showDetailDrawer} title="Detail Project" on:close={() => (showDetailDrawer = false)}>
  <ProjectDetail project={selectedProject} />
</Drawer>

<ConfirmDialog
  bind:open={showConfirmDelete}
  title="Hapus Project?"
  message={`Project "${targetProject?.name ?? ''}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
  confirmText="Hapus"
  cancelText="Batal"
  pending={confirmPending}
  on:confirm={onConfirmDelete}
  on:cancel={onCancelDelete}
/>
