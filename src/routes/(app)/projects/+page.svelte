<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';
  import Drawer from '$lib/components/Drawer.svelte';
  import ProjectDetail from '$lib/components/detail/ProjectDetail.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import ProjectFormModal from '$lib/components/form/ProjectFormModal.svelte';

  let projects: any[] = [];
  let customers: any[] = [];
  let loading = true;
  let error = '';
  let search: string = '';
  let statusFilter: string = '';
  let kategoriFilter: string = '';
  let certProjectFilter: boolean = false;
  let dateFromFilter: string = '';
  let dateToFilter: string = '';
  let showDateFilter: boolean = false;
  let currentPage: number = 1;
  let lastPage: number = 1;
  let totalProjects: number = 0;
  let perPage: number = 10;
  const perPageOptions = [10, 25, 50, 100];

  // toggle tampilan
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

  // modal
  let showCreateModal = false;
  let showEditModal = false;
  let editingProject: any = null;

  // drawer
  let showDetailDrawer = false;
  let selectedProject: any = null;

  // form
  let form = {
    name: '', description: '', status: '', start_date: '', finish_date: '',
    mitra_id: '', kategori: '', lokasi: '', no_po: '', no_so: '', is_cert_projects: false,
  };

  const projectStatuses = ['Ongoing', 'Prospect', 'Complete', 'Cancel'];
  const projectKategoris = [
    'PLTS Hybrid','PLTS Ongrid','PLTS Offgrid','PJUTS All In One','PJUTS Two In One','PJUTS Konvensional'
  ];

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
        per_page: perPage
      })}`;

      const res: any = await apiFetch(url, { auth: true });

      // fleksibel terhadap bentuk respons
      projects = res?.data ?? res?.items ?? res?.projects ?? res ?? [];
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
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  function handleFilterOrSearch() { currentPage = 1; fetchProjects(); }
  function clearFilters() {
    search = ''; statusFilter = ''; kategoriFilter = '';
    dateFromFilter = ''; dateToFilter = ''; showDateFilter = false;
    currentPage = 1; fetchProjects();
  }
  function toggleDateFilter() { showDateFilter = !showDateFilter; }
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.date-filter-dropdown') && !target.closest('.date-filter-button')) showDateFilter = false;
  }
  function goToPage(page: number) { if (page > 0 && page <= lastPage) { currentPage = page; fetchProjects(); } }

  function openCreateModal() {
    form = {
      name:'', description:'', status:'', start_date:'', finish_date:'',
      mitra_id:'', kategori:'', lokasi:'', no_po:'', no_so:'', is_cert_projects:false
    };
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
    if (!confirm('Apakah Anda yakin ingin menghapus project ini?')) return;
    try {
      await apiFetch(`/projects/${projectId}`, { method: 'DELETE', auth: true });
      alert('Project berhasil dihapus!');
      goto('/projects'); fetchProjects();
    } catch (err: any) {
      alert('Gagal menghapus project: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

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
</script>

<svelte:head><title>Daftar Project - Indogreen</title></svelte:head>

<!-- Filter bar -->
<div class="flex flex-col sm:flex-row items-center justify-between mb-5 gap-3">
  <div class="flex w-full sm:w-auto gap-2">
    <select bind:value={statusFilter} on:change={handleFilterOrSearch}
      class="px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10
             bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 dark:text-slate-100">
      <option value="">Filter Status: Semua</option>
      {#each projectStatuses as status}<option value={status}>{status}</option>{/each}
    </select>

    <select bind:value={kategoriFilter} on:change={handleFilterOrSearch}
      class="px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10
             bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 dark:text-slate-100">
      <option value="">Filter Kategori: Semua</option>
      {#each projectKategoris as k}<option value={k}>{k}</option>{/each}
    </select>

    <label class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10
                  bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 dark:text-slate-100">
      <input type="checkbox" bind:checked={certProjectFilter} on:change={handleFilterOrSearch}
             class="h-4 w-4 rounded border-black/10 dark:border-white/10" />
      <span>Certificate</span>
    </label>
  </div>

  <div class="w-full sm:w-auto flex-grow">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>
      </div>
      <input type="text" placeholder="Cari project..." bind:value={search} on:input={handleFilterOrSearch}
        class="block w-full pl-10 pr-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10
               bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 placeholder-slate-500
               dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
    </div>
  </div>

  <button on:click={openCreateModal}
    class="px-4 py-2 w-full sm:w-auto rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm">
    Tambah Project
  </button>
</div>

<!-- Switch + Date -->
<div class="flex items-center justify-between mb-4">
  <div class="bg-slate-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl inline-flex gap-1 p-1"
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

  <div class="relative">
    <button on:click={toggleDateFilter}
      class="date-filter-button inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
             border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur
             text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      <span>Filter Tanggal</span>
      {#if dateFromFilter || dateToFilter}<div class="w-2 h-2 bg-violet-600 rounded-full"></div>{/if}
      <svg class="w-4 h-4 transition-transform" class:rotate-180={showDateFilter} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
    </button>

    {#if showDateFilter}
      <div class="date-filter-dropdown absolute right-0 mt-2 w-80 rounded-2xl border border-black/5 dark:border-white/10
                  bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur shadow-xl z-10 p-4">
        <div class="space-y-3">
          {#if dateFromFilter || dateToFilter}
            <div class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
              {#if dateFromFilter && dateToFilter}
                {new Date(dateFromFilter).toLocaleDateString('id-ID')} - {new Date(dateToFilter).toLocaleDateString('id-ID')}
              {:else if dateFromFilter}
                Dari: {new Date(dateFromFilter).toLocaleDateString('id-ID')}
              {:else if dateToFilter}
                Sampai: {new Date(dateToFilter).toLocaleDateString('id-ID')}
              {/if}
            </div>
          {/if}
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dari Tanggal</label>
            <input type="date" bind:value={dateFromFilter} on:change={handleFilterOrSearch}
              class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sampai Tanggal</label>
            <input type="date" bind:value={dateToFilter} on:change={handleFilterOrSearch}
              class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
          </div>
          <div class="flex gap-2 pt-2">
            <button on:click={clearFilters}
              class="flex-1 px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5">
              Clear All
            </button>
            <button on:click={() => (showDateFilter=false)}
              class="flex-1 px-3 py-2 text-sm font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700">
              Close
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if loading}
  <p class="text-slate-900 dark:text-slate-100">Memuat project...</p>
{:else if error}
  <p class="text-rose-500">{error}</p>
{:else if projects.length === 0}
  <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
    <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada project.</p>
  </div>
{:else}
  {#if activeView === 'list'}
    <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
      <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
        {#each projects as project (project.id)}
          <li>
            <a href={`/projects/${project.id}`}
               class="block hover:bg-violet-600/5 dark:hover:bg-white/5 px-4 py-4 sm:px-6">
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
              <button on:click|stopPropagation={() => handleDelete(project.id)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
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
    <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
          <thead class="bg-slate-50/60 dark:bg-white/5">
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
                <td class="whitespace-nowrap px-3 py-4 text-sm">
                  <div class="flex items-center gap-2">
                    <button on:click={() => openDetailDrawer(project)} class="text-amber-600 hover:text-amber-700" title="Detail">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button on:click|stopPropagation={() => openEditModal(project)} title="Edit" class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button on:click|stopPropagation={() => handleDelete(project.id)} title="Delete" class="text-rose-600 hover:text-rose-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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

<!-- Modals -->
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

<!-- Drawer detail -->
<Drawer bind:show={showDetailDrawer} title="Detail Project" on:close={() => (showDetailDrawer = false)}>
  <ProjectDetail project={selectedProject} />
</Drawer>
