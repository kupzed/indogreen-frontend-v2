<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';
  import BarangCertificatesDetail from '$lib/components/detail/BarangCertificatesDetail.svelte';
  import BarangCertificateFormModal from '$lib/components/form/BarangCertificateFormModal.svelte';

  type Mitra = { id: number; nama: string };

  let id: string | undefined;
  let item: any = null;
  let loading = true;
  let error = '';

  let mitras: Mitra[] = [];
  let showEditModal = false;

  let form: { name: string; no_seri: string; mitra_id: number | '' | null } = {
    name: '', no_seri: '', mitra_id: ''
  };

  async function fetchDependencies() {
    try {
      const res: any = await apiFetch('/barang-certificate/getFormDependencies', { auth: true });
      mitras = res?.data?.mitras ?? res?.mitras ?? [];
    } catch { /* ignore */ }
  }

  async function fetchDetail() {
    loading = true; error = '';
    id = $page.params.id;
    try {
      const res: any = await apiFetch(`/barang-certificates/${id}`, { auth: true });
      item = res?.data ?? res;
    } catch (e: any) {
      error = e?.message || 'Gagal memuat detail.';
    } finally {
      loading = false;
    }
  }

  function openEditModal() {
    if (!item) return;
    form = { name: item.name ?? '', no_seri: item.no_seri ?? '', mitra_id: item.mitra_id ?? '' };
    showEditModal = true;
  }

  async function handleSubmitUpdate() {
    try {
      await apiFetch(`/barang-certificates/${id}`, { method: 'PUT', body: form, auth: true });
      alert('Data berhasil diperbarui!');
      showEditModal = false;
      await fetchDetail();
      goto(`/barang-certificates/${id}`);
    } catch (err: any) {
      alert('Error:\n' + (err?.message || 'Gagal memperbarui data.'));
    }
  }

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try {
      await apiFetch(`/barang-certificates/${id}`, { method: 'DELETE', auth: true });
      alert('Data berhasil dihapus!');
      goto('/barang-certificates');
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  onMount(() => {
    if (!getToken()) { goto('/auth/login'); return; }
    fetchDependencies();
    fetchDetail();
  });
</script>

<svelte:head><title>Detail Barang Sertifikat - Indogreen</title></svelte:head>

{#if loading}
  <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]" role="status" aria-busy="true">
    <!-- Header skeleton -->
    <div class="py-3">
      <div class="flex justify-between items-start gap-4">
        <div class="flex-1 min-w-0">
          <div class="h-7 w-64 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
          <div class="my-2 flex flex-wrap gap-3">
            <div class="h-4 w-52 rounded-md bg-slate-200/60 dark:bg-white/10 animate-pulse"></div>
            <span class="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/10 animate-pulse"></span>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 shrink-0">
          <div class="h-9 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
          <div class="h-9 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Panel skeleton singkat -->
    <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#12101d]/60 backdrop-blur shadow-sm p-6">
      <div class="h-5 w-40 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
      <div class="mt-4 space-y-3">
        {#each Array(3) as _}
          <div class="h-10 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"></div>
        {/each}
      </div>
    </div>
  </section>
{:else if error}
  <p class="mt-4 text-rose-500">{error}</p>
{:else if !item}
  <p class="mt-4 text-slate-900 dark:text-slate-100">Data tidak ditemukan.</p>
{:else}
  <div class="pt-3 mx-auto mb-8">
    <div class="flex justify-between items-start gap-4 mb-4">
      <div class="min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100">{item.name}</h2>
        <div class="my-2 flex flex-wrap gap-3 text-sm">
          <div class="flex items-center text-sm text-slate-500 dark:text-slate-300">
            <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            {new Date(item.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}
          </div>
          <div class="my-2 flex items-center text-sm">
            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300">
              {item.no_seri}
            </span>
          </div>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 shrink-0">
        <button on:click={openEditModal}
          class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
        <button on:click={handleDelete}
          class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
      </div>
    </div>

    <div class="bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur border border-black/5 dark:border-white/10 shadow-sm overflow-hidden mb-8">
      <div class="px-4 py-5 sm:px-6 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur">
        <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">Informasi Barang Sertifikat</h3>
      </div>
      <div class="px-4 py-3 sm:px-6">
        <BarangCertificatesDetail barangCertificates={item} />
      </div>
    </div>
  </div>

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
