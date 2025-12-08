<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';
  import ActivityDetail from '$lib/components/detail/ActivityDetail.svelte';
  import ActivityFormModal from '$lib/components/form/ActivityFormModal.svelte';
  import { userPermissions } from '$lib/stores/permissions';

  let activityId: string | null = null;
  let activity: any = null;

  // form dependencies
  let projects: any[] = [];
  let vendors: any[] = [];
  let customers: any[] = [];
  let activityKategoriList: string[] = [];
  let activityJenisList: string[] = [];

  // permissions
  let canUpdateActivity = false;
  let canDeleteActivity = false;

  $: {
    const perms = $userPermissions ?? [];
    canUpdateActivity = perms.includes('activity-update');
    canDeleteActivity = perms.includes('activity-delete');
  }

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
    short_desc: string;
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

  // -------- helpers ----------
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

      activityKategoriList = Array.isArray(res.kategori_list)
        ? res.kategori_list
        : [];

      activityJenisList = Array.isArray(res.jenis_list)
        ? res.jenis_list
        : [];

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
        short_desc: activity?.short_desc ?? '',
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

  function openEditModal() {
    if (!canUpdateActivity) {
      console.warn('Blocked: lacking activity-update permission');
      return;
    }
    showEditModal = true;
  }

  async function handleSubmitUpdate() {
    if (!activity?.id) return;
    if (!canUpdateActivity) {
      console.warn('Blocked: lacking activity-update permission (submit)');
      return;
    }
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
    if (!canDeleteActivity) {
      console.warn('Blocked: lacking activity-delete permission');
      return;
    }
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
  $: lockBodyScroll(showEditModal);
</script>

<svelte:head><title>Detail Activity - Indogreen</title></svelte:head>

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
        {#each Array(10) as _}
          <div class="h-10 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"></div>
        {/each}
      </div>
    </div>
  </section>
{:else if error}
  <p class="mt-4 text-rose-500">{error}</p>
{:else if activity}
  <div class="pt-3 mx-auto mb-8">
    <div class="flex justify-between items-start gap-4 mb-4">
      <div class="min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100">{activity.name}</h2>
        <div class="my-2 flex flex-wrap gap-3 text-sm">
          <div class="flex items-center text-sm text-slate-500 dark:text-slate-300">
            <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            {new Date(activity.activity_date).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}
          </div>
          <div class="my-2 flex items-center text-sm">
            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300">
              {activity.kategori}
            </span>
          </div>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 shrink-0">
        {#if canUpdateActivity}
          <button on:click={openEditModal}
            class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
        {/if}
        {#if canDeleteActivity}
          <button on:click={handleDelete}
            class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
        {/if}
      </div>
    </div>

    <div class="bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur border border-black/5 dark:border-white/10 shadow-sm overflow-hidden mb-8">
      <div class="px-4 py-5 sm:px-6 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur">
        <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">Informasi Aktivitas</h3>
      </div>
      <div class="px-4 py-3 sm:px-6">
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
    {activityKategoriList}
    {activityJenisList}
    allowRemoveAttachment={true}
    onSubmit={handleSubmitUpdate}
  />
{/if}
