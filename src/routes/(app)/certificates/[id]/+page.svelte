<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';
  import CertificateFormModal from '$lib/components/form/CertificateFormModal.svelte';
  import CertificateDetail from '$lib/components/detail/CertificatesDetail.svelte';

  type Option = { id: number; name?: string; title?: string; no_seri?: string };
  type AttachmentItem = {
    id: number;
    name: string;
    description?: string;
    original_name?: string;
    url: string;
    size?: number;
  };

  let id: string | undefined;
  let item: any = null;
  let loading = true;
  let error = '';

  let projects: Option[] = [];
  let barangCertificates: Option[] = [];
  let filteredBarangCertificates: Option[] = [];

  let showEditModal = false;

  let form: {
    name: string;
    no_certificate: string;
    project_id: number | '' | null;
    barang_certificate_id: number | '' | null;
    status: 'Belum' | 'Tidak Aktif' | 'Aktif' | '';
    date_of_issue: string;
    date_of_expired: string;
    attachments: File[];
    attachment_names: string[];
    attachment_descriptions: string[];
    existing_attachments: AttachmentItem[];
    removed_existing_ids: number[];
  } = {
    name: '',
    no_certificate: '',
    project_id: '',
    barang_certificate_id: '',
    status: '',
    date_of_issue: '',
    date_of_expired: '',
    attachments: [],
    attachment_names: [],
    attachment_descriptions: [],
    existing_attachments: [],
    removed_existing_ids: []
  };

  const statuses = ['Belum', 'Tidak Aktif', 'Aktif'] as const;

  async function fetchDependencies() {
    try {
      const res: any = await apiFetch('/certificate/getFormDependencies', { auth: true });
      projects = res?.data?.projects ?? res?.projects ?? [];
      barangCertificates = res?.data?.barang_certificates ?? res?.barang_certificates ?? [];
      filteredBarangCertificates = [];
    } catch { /* ignore */ }
  }

  async function fetchBarangCertificatesByProject(projectId: number) {
    if (!projectId) { filteredBarangCertificates = []; return; }
    try {
      const res: any = await apiFetch(`/certificate/getBarangCertificatesByProject/${projectId}`, { auth: true });
      filteredBarangCertificates = res?.data ?? res ?? [];
    } catch {
      filteredBarangCertificates = [];
    }
  }

  function handleProjectChange(projectId: number | '' | null) {
    if (projectId) {
      fetchBarangCertificatesByProject(Number(projectId));
      form.barang_certificate_id = '';
    } else {
      filteredBarangCertificates = [];
      form.barang_certificate_id = '';
    }
  }

  function appendScalar(fd: FormData, key: string, val: any) {
    if (val === null || val === undefined || val === '') return;
    fd.append(key, String(val));
  }

  function buildFormData() {
    const fd = new FormData();
    appendScalar(fd, 'name', form.name);
    appendScalar(fd, 'no_certificate', form.no_certificate);
    appendScalar(fd, 'project_id', form.project_id);
    appendScalar(fd, 'barang_certificate_id', form.barang_certificate_id);
    appendScalar(fd, 'status', form.status);
    appendScalar(fd, 'date_of_issue', form.date_of_issue);
    appendScalar(fd, 'date_of_expired', form.date_of_expired);

    (form.attachments || []).forEach((file, i) => fd.append(`attachments[${i}]`, file));
    (form.attachment_names || []).forEach((n, i) => n != null && fd.append(`attachment_names[${i}]`, n));
    (form.attachment_descriptions || []).forEach((d, i) => d != null && fd.append(`attachment_descriptions[${i}]`, d));

    (form.removed_existing_ids || []).forEach((rid) => fd.append('removed_existing_ids[]', String(rid)));
    (form.existing_attachments || []).forEach((att, i) => {
      fd.append(`existing_attachment_ids[${i}]`, String(att.id));
      fd.append(`existing_attachment_names[${i}]`, att.name);
      fd.append(`existing_attachment_descriptions[${i}]`, att.description ?? '');
    });
    return fd;
  }

  async function fetchDetail() {
    loading = true; error = '';
    id = $page.params.id;
    try {
      const res: any = await apiFetch(`/certificates/${id}`, { auth: true });
      item = res?.data ?? res;

      form = {
        name: item?.name ?? '',
        no_certificate: item?.no_certificate ?? '',
        project_id: item?.project_id ?? '',
        barang_certificate_id: item?.barang_certificate_id ?? '',
        status: item?.status ?? '',
        date_of_issue: item?.date_of_issue ? new Date(item.date_of_issue).toISOString().split('T')[0] : '',
        date_of_expired: item?.date_of_expired ? new Date(item.date_of_expired).toISOString().split('T')[0] : '',
        attachments: [],
        attachment_names: [],
        attachment_descriptions: [],
        existing_attachments: Array.isArray(item?.attachments)
          ? item.attachments.map((a: any) => ({
              id: a.id,
              name: a.name ?? a.file_name ?? 'Lampiran',
              description: a.description ?? '',
              original_name: a.original_name ?? a.file_name ?? a.name ?? '',
              url: a.url ?? a.path ?? a.file_path,
              size: a.size
            }))
          : [],
        removed_existing_ids: []
      };
    } catch (e: any) {
      error = e?.message || 'Gagal memuat detail.';
    } finally {
      loading = false;
    }
  }

  function openEditModal() {
    if (item?.project_id && typeof item.project_id === 'number') {
      fetchBarangCertificatesByProject(item.project_id);
    } else {
      filteredBarangCertificates = [];
    }
    showEditModal = true;
  }

  async function handleSubmitUpdate() {
    try {
      const fd = buildFormData();
      fd.append('_method', 'PUT');
      await apiFetch(`/certificates/${id}`, { method: 'POST', body: fd, auth: true });
      alert('Data berhasil diperbarui!');
      showEditModal = false;
      await fetchDetail();
      goto(`/certificates/${id}`);
    } catch (err: any) {
      alert('Error:\n' + (err?.message || 'Gagal memperbarui data.'));
    }
  }

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try {
      await apiFetch(`/certificates/${id}`, { method: 'DELETE', auth: true });
      alert('Data berhasil dihapus!');
      goto('/certificates');
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

<svelte:head><title>Detail Sertifikat - Indogreen</title></svelte:head>

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
        <div class="mt-2 text-sm text-slate-600 dark:text-slate-300">No. Sertifikat: {item.no_certificate}</div>
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
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">Informasi Sertifikat</h3>
      </div>
      <div class="p-4">
        <CertificateDetail certificates={item} />
      </div>
    </div>
  </div>

  <CertificateFormModal
    bind:show={showEditModal}
    title="Edit Certificate"
    submitLabel="Update"
    idPrefix="edit"
    {form}
    {projects}
    barangOptions={filteredBarangCertificates}
    statuses={Array.from(statuses)}
    handleProjectChange={handleProjectChange}
    allowRemoveAttachment={true}
    onSubmit={handleSubmitUpdate}
  />
{/if}
