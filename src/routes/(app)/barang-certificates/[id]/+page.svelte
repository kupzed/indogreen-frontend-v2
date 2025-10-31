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
  <p class="mt-4 text-slate-900 dark:text-slate-100">Memuat detail...</p>
{:else if error}
  <p class="mt-4 text-rose-500">{error}</p>
{:else if !item}
  <p class="mt-4 text-slate-900 dark:text-slate-100">Data tidak ditemukan.</p>
{:else}
  <div class="mx-auto mb-8">
    <div class="flex justify-between items-start gap-4 mb-4">
      <div class="min-w-0">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{item.name}</h2>
        <div class="mt-2 text-sm text-slate-600 dark:text-slate-300">No. Seri: {item.no_seri}</div>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 shrink-0">
        <button on:click={openEditModal}
          class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
        <button on:click={handleDelete}
          class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
      </div>
    </div>

    <div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur">
      <div class="px-4 py-3 border-b border-black/5 dark:border-white/10">
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">Informasi Barang Certificate</h3>
      </div>
      <div class="p-4">
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
