<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';
  import ActivityDetail from '$lib/components/detail/ActivityDetail.svelte';
  import ActivityFormModal from '$lib/components/form/ActivityFormModal.svelte';

  let activityId: string | null = null;
  let activity: any = null;

  // form dependencies
  let projects: any[] = [];
  let vendors: any[] = [];
  let customers: any[] = [];

  // ui state
  let loading = true;
  let error = '';
  let showEditModal = false;

  // ---- form state (supports new & existing attachments) ----
  type ExistingAtt = {
    id: number;
    name: string;
    description?: string;
    original_name?: string;
    url: string;
    size?: number;
  };

  let form: {
    name: string;
    description: string;
    project_id: string | number | '';
    kategori: string | '';
    activity_date: string | '';
    jenis: string | '';
    mitra_id: number | string | '' | null;
    from?: string | '';
    to?: string | '';
    attachments: File[];
    attachment_names: string[];
    attachment_descriptions: string[];
    existing_attachments?: ExistingAtt[];
    removed_existing_ids?: number[];
  } = {
    name: '',
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

  // -------- helpers ----------
  function appendScalar(fd: FormData, key: string, val: any) {
    if (val === null || val === undefined || val === '') return;
    fd.append(key, String(val));
  }

  function buildFormDataForActivity() {
    const fd = new FormData();
    appendScalar(fd, 'name', form.name);
    appendScalar(fd, 'description', form.description);
    appendScalar(fd, 'project_id', form.project_id);
    appendScalar(fd, 'kategori', form.kategori);
    appendScalar(fd, 'activity_date', form.activity_date);
    appendScalar(fd, 'jenis', form.jenis);
    appendScalar(fd, 'from', form.from);
    appendScalar(fd, 'to', form.to);

    // mitra rules
    if (form.jenis === 'Internal') {
      fd.set('mitra_id', '1');
    } else if (form.jenis === 'Customer') {
      const selectedProject = projects.find((p) => p.id == form.project_id);
      if (selectedProject?.mitra_id) fd.set('mitra_id', String(selectedProject.mitra_id));
    } else if (form.jenis === 'Vendor' && form.mitra_id) {
      fd.set('mitra_id', String(form.mitra_id));
    }

    (form.attachments || []).forEach((file, i) => fd.append(`attachments[${i}]`, file));
    (form.attachment_names || []).forEach((n, i) => n != null && fd.append(`attachment_names[${i}]`, n));
    (form.attachment_descriptions || []).forEach((d, i) => d != null && fd.append(`attachment_descriptions[${i}]`, d));

    (form.existing_attachments || []).forEach((att, i) => {
      fd.append(`existing_attachment_ids[${i}]`, String(att.id));
      fd.append(`existing_attachment_names[${i}]`, att.name);
      fd.append(`existing_attachment_descriptions[${i}]`, att.description ?? '');
    });

    (form.removed_existing_ids || []).forEach((id) => fd.append('removed_existing_ids[]', String(id)));
    return fd;
  }

  async function fetchDependencies() {
    try {
      const res: any = await apiFetch('/activity/getFormDependencies', { auth: true });
      projects = res?.projects ?? res?.data?.projects ?? [];
      vendors  = res?.vendors  ?? res?.data?.vendors  ?? [];
      // optional customers
      try {
        const c: any = await apiFetch('/mitra/customers', { auth: true });
        customers = c?.data ?? c ?? [];
      } catch { customers = []; }

      // enrich project.mitra bila perlu
      const mitraMap = new Map<any, any>();
      vendors?.forEach((v: any) => mitraMap.set(v.id, v));
      customers?.forEach((m: any) => mitraMap.set(m.id, m));
      projects = projects.map((p: any) => ({
        ...p,
        mitra: p.mitra || (p.mitra_id ? mitraMap.get(p.mitra_id) : (p.customer_id ? mitraMap.get(p.customer_id) : undefined))
      }));
    } catch (e) {
      // ignore
    }
  }

  async function fetchDetail() {
    loading = true; error = '';
    activityId = $page.params.id ?? null;
    if (!activityId) {
      error = 'Activity ID tidak ditemukan.';
      loading = false;
      return;
    }
    try {
      const res: any = await apiFetch(`/activities/${activityId}`, { auth: true });
      activity = res?.data ?? res;
      form = {
        name: activity?.name ?? '',
        description: activity?.description ?? '',
        project_id: activity?.project_id ?? '',
        kategori: activity?.kategori ?? '',
        activity_date: activity?.activity_date ? new Date(activity.activity_date).toISOString().split('T')[0] : '',
        jenis: activity?.jenis ?? '',
        mitra_id: activity?.mitra_id ?? null,
        from: activity?.from ?? '',
        to: activity?.to ?? '',
        attachments: [],
        attachment_names: [],
        attachment_descriptions: [],
        existing_attachments: Array.isArray(activity?.attachments)
          ? activity.attachments.map((a: any) => ({
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
    } catch (err: any) {
      error = err?.message || 'Gagal memuat detail aktivitas.';
    } finally {
      loading = false;
    }
  }

  function openEditModal() { showEditModal = true; }

  async function handleSubmitUpdate() {
    if (!activity?.id) return;
    try {
      const fd = buildFormDataForActivity();
      fd.append('_method', 'PUT');
      await apiFetch(`/activities/${activity.id}`, { method: 'POST', body: fd, auth: true });
      alert('Aktivitas berhasil diperbarui!');
      showEditModal = false;
      await fetchDetail();
      goto(`/activities/${activity.id}`);
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui aktivitas.';
      alert('Error:\n' + msg);
    }
  }

  async function handleDelete() {
    if (!activity?.id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) return;
    try {
      await apiFetch(`/activities/${activity.id}`, { method: 'DELETE', auth: true });
      alert('Aktivitas berhasil dihapus!');
      goto('/activities');
    } catch (err: any) {
      alert('Gagal menghapus aktivitas: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  // reactive sync mitra_id based on jenis/project
  let previousJenis = '';
  $: if (showEditModal && form.jenis && form.jenis !== previousJenis) {
    previousJenis = form.jenis;
    if (form.jenis === 'Customer') {
      const p = projects.find((x) => x.id == form.project_id);
      form.mitra_id = p?.mitra_id || null;
    } else if (form.jenis === 'Internal') form.mitra_id = '1';
    else if (form.jenis === 'Vendor') {
      if (!vendors.some((v) => v.id == form.mitra_id)) form.mitra_id = '';
    } else form.mitra_id = null;
  }
  $: if (form.jenis === 'Customer' && form.project_id) {
    const p = projects.find((x) => x.id == form.project_id);
    if (p?.mitra_id && form.mitra_id !== p.mitra_id) form.mitra_id = p.mitra_id;
  }
  $: if (!showEditModal) previousJenis = '';

  onMount(() => {
    if (!getToken()) { goto('/auth/login'); return; }
    fetchDependencies();
    fetchDetail();
  });
</script>

<svelte:head><title>Detail Activity - Indogreen</title></svelte:head>

{#if loading}
  <p class="mt-4 text-slate-900 dark:text-slate-100">Memuat detail aktivitas...</p>
{:else if error}
  <p class="mt-4 text-rose-500">{error}</p>
{:else if activity}
  <div class="mx-auto mb-8">
    <div class="flex justify-between items-start gap-4 mb-4">
      <div class="min-w-0">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{activity.name}</h2>
        <div class="mt-2 flex flex-wrap gap-3 text-sm">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300">{activity.kategori}</span>
          <span class="text-slate-600 dark:text-slate-300">
            {new Date(activity.activity_date).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}
          </span>
        </div>
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
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">Informasi Aktivitas</h3>
      </div>
      <div class="p-4">
        <ActivityDetail {activity} />
      </div>
    </div>
  </div>

  <ActivityFormModal
    bind:show={showEditModal}
    title="Edit Aktivitas"
    submitLabel="Update Aktivitas"
    idPrefix="edit_activity"
    {form}
    {projects}
    {vendors}
    allowRemoveAttachment={true}
    onSubmit={handleSubmitUpdate}
  />
{/if}
