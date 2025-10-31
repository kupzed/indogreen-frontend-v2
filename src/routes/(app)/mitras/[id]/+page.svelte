<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';

  import Drawer from '$lib/components/Drawer.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import BarangCertificatesDetail from '$lib/components/detail/BarangCertificatesDetail.svelte';
  import MitraDetail from '$lib/components/detail/MitraDetail.svelte';
  import MitraFormModal from '$lib/components/form/MitraFormModal.svelte';
  import BarangCertificateFormModal from '$lib/components/form/BarangCertificateFormModal.svelte';

  // ================== STATE: MITRA ==================
  let mitraId: string | null = null;
  let mitra: any = null;
  let loadingMitra = true;
  let errorMitra = '';

  // Modal edit Mitra
  let showEditModal = false;
  let editingMitra: any = null;

  // Form edit Mitra
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

  const mitraKategoriOptions = ['Pribadi', 'Perusahaan', 'Customer', 'Vendor'];

  // Tabs
  let activeTab: 'detail' | 'barang' = 'detail';

  // ================== STATE: BARANG-CERTIFICATES (per mitra) ==================
  type BarangCertificate = {
    id: number;
    name: string;
    no_seri: string;
    mitra_id: number | '' | null;
    mitra?: { id: number; nama: string } | null;
    created_at?: string;
    updated_at?: string;
  };

  let bcItems: BarangCertificate[] = [];
  let bcLoading = false;
  let bcError = '';
  let bcSearch = '';
  let bcCurrentPage = 1;
  let bcLastPage = 1;
  let bcTotalItems = 0;
  let perPage = 50;
  const perPageOptions = [10, 25, 50, 100];
  let bcInitialized = false;

  // View toggle
  let bcActiveView: 'table' | 'list' = 'table';
  const views: Array<'table' | 'list'> = ['table', 'list'];
  function handleViewKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      let idx = views.indexOf(bcActiveView);
      idx = e.key === 'ArrowRight' ? (idx + 1) % views.length : (idx - 1 + views.length) % views.length;
      bcActiveView = views[idx];
    }
  }

  // Barang Certificates: form state (mitra dikunci oleh halaman ini)
  let bcForm: { name: string; no_seri: string; mitra_id: number | '' | null } = {
    name: '',
    no_seri: '',
    mitra_id: ''
  };

  // ================== HELPERS ==================
  function qs(obj: Record<string, any>) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
    });
    return p.toString();
  }

  function getKategoriBadgeColor(kategori: string) {
    const base = 'inline-flex rounded-full px-2 text-xs font-semibold leading-5';
    switch (kategori) {
      case 'Pribadi':
      case 'Perusahaan':
      case 'Customer':
      case 'Vendor':
        return `${base} bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200`;
      default:
        return `${base} bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200`;
    }
  }

  // ================== API: MITRA ==================
  async function fetchMitraDetails() {
    loadingMitra = true;
    errorMitra = '';
    if (!mitraId) {
      errorMitra = 'Mitra ID tidak ditemukan.';
      loadingMitra = false;
      return;
    }
    try {
      const res: any = await apiFetch(`/mitras/${mitraId}`, { auth: true });
      mitra = res?.data ?? res ?? null;
      form = { ...form, ...(mitra || {}) };
      editingMitra = mitra;
    } catch (err: any) {
      errorMitra = err?.message || 'Gagal memuat detail mitra.';
      console.error(err);
    } finally {
      loadingMitra = false;
    }
  }

  function openEditModal() { showEditModal = true; }

  async function handleSubmitUpdate() {
    if (!mitra?.id) return;
    try {
      await apiFetch(`/mitras/${mitra.id}`, { method: 'PUT', body: form, auth: true });
      alert('Mitra berhasil diperbarui!');
      goto(`/mitras/${mitra.id}`);
      showEditModal = false;
      fetchMitraDetails();
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui mitra.';
      alert('Error:\n' + msg);
    }
  }

  async function handleDelete() {
    if (!mitra?.id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus mitra ini?')) return;
    try {
      await apiFetch(`/mitras/${mitra.id}`, { method: 'DELETE', auth: true });
      alert('Mitra berhasil dihapus!');
      goto('/mitras');
    } catch (err: any) {
      alert('Gagal menghapus mitra: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  // ================== API: BARANG-CERTIFICATES (mitra) ==================
  async function fetchBarangCertificates() {
    if (!mitra?.id) return;
    bcLoading = true; bcError = '';
    try {
      const url = `/barang-certificates?${qs({
        search: bcSearch,
        mitra_id: mitra.id,
        page: bcCurrentPage,
        per_page: perPage
      })}`;
      const res: any = await apiFetch(url, { auth: true });
      bcItems       = res?.data ?? res?.items ?? res ?? [];
      bcCurrentPage = res?.pagination?.current_page ?? res?.current_page ?? 1;
      bcLastPage    = res?.pagination?.last_page   ?? res?.last_page   ?? 1;
      bcTotalItems  = res?.pagination?.total       ?? res?.total       ?? (Array.isArray(bcItems) ? bcItems.length : 0);
    } catch (err: any) {
      bcError = err?.message || 'Gagal memuat data.';
      console.error(err);
    } finally {
      bcLoading = false;
    }
  }

  function bcHandleSearchChange() { bcCurrentPage = 1; fetchBarangCertificates(); }
  function bcGoToPage(page: number) { if (page > 0 && page <= bcLastPage) { bcCurrentPage = page; fetchBarangCertificates(); } }

  function bcOpenCreateModal() {
    if (!mitra?.id) return;
    bcForm = { name: '', no_seri: '', mitra_id: mitra.id };
    bcShowCreateModal = true;
  }
  function bcOpenEditModal(item: BarangCertificate) {
    bcEditingItem = { ...item };
    bcForm = { name: item.name ?? '', no_seri: item.no_seri ?? '', mitra_id: mitra?.id ?? '' };
    bcShowEditModal = true;
  }
  function bcOpenDetailDrawer(item: BarangCertificate) { bcSelectedItem = { ...item }; bcShowDetailDrawer = true; }

  async function bcHandleSubmitCreate() {
    try {
      if (mitra?.id) bcForm.mitra_id = mitra.id;
      await apiFetch('/barang-certificates', { method: 'POST', body: bcForm, auth: true });
      alert('Data berhasil ditambahkan');
      bcShowCreateModal = false;
      fetchBarangCertificates();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan data.';
      alert('Error:\n' + msg);
    }
  }

  async function bcHandleSubmitUpdate() {
    if (!bcEditingItem?.id) return;
    try {
      if (mitra?.id) bcForm.mitra_id = mitra.id;
      await apiFetch(`/barang-certificates/${bcEditingItem.id}`, { method: 'PUT', body: bcForm, auth: true });
      alert('Data berhasil diperbarui');
      bcShowEditModal = false;
      fetchBarangCertificates();
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui data.';
      alert('Error:\n' + msg);
    }
  }

  async function bcHandleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await apiFetch(`/barang-certificates/${id}`, { method: 'DELETE', auth: true });
      alert('Data berhasil dihapus');
      fetchBarangCertificates();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  // ================== LIFECYCLE ==================
  onMount(() => {
    if (!getToken()) { goto('/auth/login'); return; }
    mitraId = $page.params.id ?? null;
    fetchMitraDetails();
  });

  // Lazy load tab barang saat pertama dibuka
  $: if (activeTab === 'barang' && mitra?.id && !bcInitialized) {
    bcInitialized = true;
    fetchBarangCertificates();
  }

  // ================== UI UTILITY ==================
  // Kunci scroll saat overlay terbuka
  let bcShowCreateModal = false;
  let bcShowEditModal = false;
  let bcEditingItem: BarangCertificate | null = null;
  let bcShowDetailDrawer = false;
  let bcSelectedItem: BarangCertificate | null = null;

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
  $: lockBodyScroll(showEditModal || bcShowCreateModal || bcShowEditModal || bcShowDetailDrawer);
</script>

<svelte:head>
  <title>Detail Mitra - Indogreen</title>
</svelte:head>

{#if loadingMitra}
  <p class="text-slate-900 dark:text-slate-100">Memuat detail mitra...</p>
{:else if errorMitra}
  <p class="text-rose-500">{errorMitra}</p>
{:else if mitra}
  <div class="max-w-5xl mx-auto mb-8">
    <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]">
      <!-- ====== STICKY WRAPPER: Header + Tabs + (conditional) Action Bar ====== -->
      <div class="sticky z-30 top-[60px] sm:top-[72px] border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10">
        <!-- Header + actions -->
        <div class="bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-3 py-3">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100">{mitra.nama}</h2>
              <div class="mt-2 flex flex-wrap gap-2">
                {#if mitra.is_pribadi}<span class="{getKategoriBadgeColor('Pribadi')}">Pribadi</span>{/if}
                {#if mitra.is_perusahaan}<span class="{getKategoriBadgeColor('Perusahaan')}">Perusahaan</span>{/if}
                {#if mitra.is_customer}<span class="{getKategoriBadgeColor('Customer')}">Customer</span>{/if}
                {#if mitra.is_vendor}<span class="{getKategoriBadgeColor('Vendor')}">Vendor</span>{/if}
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 shrink-0">
              <button on:click={openEditModal}
                class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
              <button on:click={handleDelete}
                class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-3 py-2">
          <div class="p-1 bg-slate-200/70 dark:bg-slate-700/70 rounded-lg inline-flex" role="tablist" aria-label="Mitra tabs">
            <button
              on:click={() => (activeTab = 'detail')}
              class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200"
              class:bg-white={activeTab==='detail'}
              class:dark:bg-neutral-900={activeTab==='detail'}
              class:shadow={activeTab==='detail'}
            >Detail</button>
            <button
              on:click={() => (activeTab = 'barang')}
              class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200"
              class:bg-white={activeTab==='barang'}
              class:dark:bg-neutral-900={activeTab==='barang'}
              class:shadow={activeTab==='barang'}
            >Barang</button>
          </div>
        </div>

        {#if activeTab === 'barang'}
          <!-- Action bar untuk barang (IKUT STICKY karena di dalam wrapper ini) -->
          <div
            class="flex items-center gap-2 flex-wrap
                  bg-white/80 dark:bg-[#12101d]/80 backdrop-blur
                  px-2 py-2"
          >
            <div class="relative flex-1 min-w-0">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-black dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari barang certificate..."
                bind:value={bcSearch}
                on:input={bcHandleSearchChange}
                class="block w-full pl-10 pr-3 h-9 rounded-md text-sm border border-black/5 dark:border-white/10
                      bg-white/70 dark:bg-[#12101d]/70 backdrop-blur text-slate-800 placeholder-slate-500
                      dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
            </div>

            <div class="bg-slate-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-md inline-flex"
                role="tablist" aria-label="Switch view" tabindex="0" on:keydown={handleViewKeydown}>
              <button on:click={() => (bcActiveView='table')}
                class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                class:bg-white={bcActiveView==='table'} class:dark:bg-[#12101d]={bcActiveView==='table'} class:shadow={bcActiveView==='table'} title="Table">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><line x1="3.5" y1="9" x2="20.5" y2="9"></line><line x1="3.5" y1="13" x2="20.5" y2="13"></line><line x1="3.5" y1="17" x2="20.5" y2="17"></line></svg>
                <span class="sr-only">Tampilan Tabel</span>
              </button>
              <button on:click={() => (bcActiveView='list')}
                class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                class:bg-white={bcActiveView==='list'} class:dark:bg-[#12101d]={bcActiveView==='list'} class:shadow={bcActiveView==='list'} title="List">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="5" cy="6" r="1.3"></circle><circle cx="5" cy="12" r="1.3"></circle><circle cx="5" cy="18" r="1.3"></circle><line x1="9" y1="6" x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line></svg>
                <span class="sr-only">Tampilan List</span>
              </button>
            </div>

            <button
              on:click={bcOpenCreateModal}
              class="h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 grid place-items-center"
              aria-label="Tambah Barang" title="Tambah Barang">
              Tambah
            </button>
          </div>
        {/if}
      </div>


      <!-- ====== SCROLL AREA: content below the sticky bars ====== -->
      <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <!-- TAB: DETAIL -->
        {#if activeTab === 'detail'}
          <div class="mt-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur">
            <div class="px-4 py-3 border-b border-black/5 dark:border-white/10">
              <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">Informasi Mitra</h3>
            </div>
            <div class="px-4 py-4">
              <MitraDetail mitra={mitra} />
            </div>
          </div>
        {/if}

        <!-- TAB: BARANG-CERTIFICATES -->
        {#if activeTab === 'barang'}
          <div class="mt-4">
            <!-- Content -->
            <div class="mt-3">
              {#if bcLoading}
                <p class="text-slate-900 dark:text-slate-100">Memuat data...</p>
              {:else if bcError}
                <p class="text-rose-500">{bcError}</p>
              {:else if bcItems.length === 0}
                <div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
                  <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada data.</p>
                </div>
              {:else}
                {#if bcActiveView === 'list'}
                  <div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
                    <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
                      {#each bcItems as item (item.id)}
                        <li>
                          <a
                            href={`/barang-certificates/${item.id}`}
                            class="block hover:bg-violet-600/5 dark:hover:bg-white/5 px-4 py-4 sm:px-6"
                            on:click|preventDefault={() => bcOpenDetailDrawer(item)}
                            role="button"
                            aria-label={`Lihat detail barang certificate ${item.name}`}
                          >
                            <div class="flex items-center justify-between">
                              <p class="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">{item.name}</p>
                            </div>
                            <div class="mt-2 sm:flex sm:justify-between">
                              <p class="text-sm text-slate-600 dark:text-slate-300">
                                No. Seri: {item.no_seri} | Mitra: {mitra.nama}
                              </p>
                            </div>
                          </a>
                          <div class="flex justify-end px-4 py-2 sm:px-6 gap-2">
                            <button on:click|stopPropagation={() => bcOpenDetailDrawer(item)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700">Detail</button>
                            <button on:click|stopPropagation={() => bcOpenEditModal(item)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
                            <button on:click|stopPropagation={() => bcHandleDelete(item.id)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
                          </div>
                        </li>
                      {/each}
                    </ul>

                    {#if bcItems.length > 0}
                      <Pagination
                        currentPage={bcCurrentPage}
                        lastPage={bcLastPage}
                        onPageChange={bcGoToPage}
                        totalItems={bcTotalItems}
                        itemsPerPage={perPage}
                        perPageOptions={perPageOptions}
                        onPerPageChange={(n) => { perPage = n; bcCurrentPage = 1; fetchBarangCertificates(); }}
                      />
                    {/if}
                  </div>
                {/if}

                {#if bcActiveView === 'table'}
                  <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
                    <div class="relative overflow-x-auto">
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
                          {#each bcItems as item (item.id)}
                            <tr>
                              <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                                <a
                                  href={`/barang-certificates/${item.id}`}
                                  class="text-violet-700 dark:text-violet-300 hover:underline"
                                  on:click|preventDefault={() => bcOpenDetailDrawer(item)}
                                >{item.name}</a>
                              </td>
                              <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{item.no_seri}</td>
                              <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{mitra.nama}</td>
                              <td class="whitespace-nowrap px-3 py-4 text-sm">
                                <div class="flex items-center gap-2">
                                  <button on:click={() => bcOpenDetailDrawer(item)} class="text-amber-600 hover:text-amber-700" title="Detail">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <span class="sr-only">Detail, {item.name}</span>
                                  </button>
                                  <button on:click={() => bcOpenEditModal(item)} class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200" title="Edit">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                    <span class="sr-only">Edit, {item.name}</span>
                                  </button>
                                  <button on:click={() => bcHandleDelete(item.id)} class="text-rose-600 hover:text-rose-700" title="Hapus">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    <span class="sr-only">Hapus, {item.name}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>

                    {#if bcItems.length > 0}
                      <Pagination
                        currentPage={bcCurrentPage}
                        lastPage={bcLastPage}
                        onPageChange={bcGoToPage}
                        totalItems={bcTotalItems}
                        itemsPerPage={perPage}
                        perPageOptions={perPageOptions}
                        onPerPageChange={(n) => { perPage = n; bcCurrentPage = 1; fetchBarangCertificates(); }}
                      />
                    {/if}
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- ===== Modals / Drawer ===== -->
    <MitraFormModal
      bind:show={showEditModal}
      title="Edit Mitra"
      submitLabel="Update Mitra"
      idPrefix="edit_mitra"
      {form}
      onSubmit={handleSubmitUpdate}
    />

    <BarangCertificateFormModal
      bind:show={bcShowCreateModal}
      title="Tambah Barang Certificate"
      submitLabel="Simpan"
      idPrefix="bc_create"
      form={bcForm}
      showMitra={false}
      onSubmit={bcHandleSubmitCreate}
    />

    <BarangCertificateFormModal
      bind:show={bcShowEditModal}
      title="Edit Barang Certificate"
      submitLabel="Update"
      idPrefix="bc_edit"
      form={bcForm}
      showMitra={false}
      onSubmit={bcHandleSubmitUpdate}
    />

    <Drawer
      bind:show={bcShowDetailDrawer}
      title="Detail Barang Certificate"
      on:close={() => (bcShowDetailDrawer = false)}
    >
      <BarangCertificatesDetail barangCertificates={bcSelectedItem} />
    </Drawer>
  </div>
{/if}
