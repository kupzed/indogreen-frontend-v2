<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiFetch } from '$lib/api';
  import { storageUrl } from '$lib/utils/url';

  export let item: any = null;

  type NormalizedAttachment = {
    url: string;
    displayName: string;
    desc?: string;
    sizeLabel?: string;
  };

  const dispatch = createEventDispatcher<{
    saved: {
      activityId: number;
      value: number;
      value_formatted?: string;
      activity: any;
    };
  }>();

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val ?? 0);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatBytes = (bytes?: number | null) => {
    if (bytes === undefined || bytes === null || !Number.isFinite(bytes)) return undefined;
    let size = Number(bytes);
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    const rounded = i === 0 ? Math.round(size) : size < 10 ? size.toFixed(1) : Math.round(size).toString();
    return `${rounded}${units[i]}`;
  };

  const normalizeAttachments = (raw: any): NormalizedAttachment[] => {
    if (!raw) return [];
    const toAttachment = (att: any): NormalizedAttachment | null => {
      if (!att) return null;
      if (typeof att === 'string') {
        const filename = att.split('/').pop() ?? att;
        return { url: storageUrl(att), displayName: filename };
      }
      const path = att?.path ?? att?.file_path ?? att?.file ?? '';
      const url = att?.url ?? (path ? storageUrl(path) : '');
      if (!url) return null;
      const displayName = att?.name ?? att?.label ?? (path.split('/').pop() ?? 'Lampiran');
      return {
        url,
        displayName,
        desc: att?.description ?? att?.desc ?? att?.keterangan ?? undefined,
        sizeLabel: att?.sizeLabel ?? formatBytes(att?.size)
      };
    };
    return (Array.isArray(raw) ? raw : [raw]).map(toAttachment).filter(Boolean) as NormalizedAttachment[];
  };

  let activity: any = null;
  let attachments: NormalizedAttachment[] = [];
  let valueInput = 0;
  let showValueEditor = false;
  let submitting = false;
  let errorMessage = '';
  let successMessage = '';
  let lastActivityId: number | null = null;

  $: activity = item?.activity ?? null;
  $: attachments = normalizeAttachments(activity?.attachments ?? activity?.attachment);

  $: if (activity?.id && activity.id !== lastActivityId) {
    lastActivityId = activity.id;
    valueInput = Number(activity.value ?? 0) || 0;
    showValueEditor = false;
    errorMessage = '';
    successMessage = '';
  }

  async function handleSave() {
    if (!activity?.id) return;
    submitting = true;
    errorMessage = '';
    successMessage = '';
    try {
      const payload = { value: Number(valueInput) || 0 };
      const data = await apiFetch<{
        status: string;
        meta: { value_formatted: string };
        data: any;
      }>(`/finance/${activity.id}/value`, {
        method: 'PATCH',
        body: payload,
        auth: true
      });

      const updated = data.data;
      valueInput = Number(updated.value ?? payload.value) || 0;
      successMessage = 'Nilai berhasil diperbarui';
      dispatch('saved', {
        activityId: updated.id,
        value: updated.value,
        value_formatted: data.meta?.value_formatted,
        activity: updated
      });
    } catch (error: any) {
      errorMessage = error?.message ?? 'Gagal memperbarui nilai';
    } finally {
      submitting = false;
    }
  }
</script>

{#if activity}
  <div class="flex flex-col gap-6 py-4">
    <section class="rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-violet-600/10 via-indigo-500/5 to-transparent p-5 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            {activity.kategori}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            {formatDate(activity.activity_date)}
          </span>
        </div>
        <span class="text-xs text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          #{activity?.id}
        </span>
      </div>
      <div>
        <p class="text-lg font-semibold text-slate-900 dark:text-white">{activity.name}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {activity.short_desc || 'Tidak ada deskripsi singkat.'}
        </p>
      </div>
    </section>

    <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5 space-y-4">
      <header class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nilai / Value</p>
          <p class="text-2xl font-semibold text-slate-900 dark:text-white">{formatRupiah(activity.value)}</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-black/5 dark:border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:text-violet-700 dark:text-slate-200 dark:hover:text-violet-200 transition"
          on:click={() => (showValueEditor = !showValueEditor)}
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {showValueEditor ? 'Batal' : 'Edit'}
        </button>
      </header>

      {#if showValueEditor}
        <div class="space-y-4 rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-200" for="value-input">
            Nilai Activity (IDR)
          </label>
          <div class="flex flex-col gap-3 sm:flex-row">
            <input
              id="value-input"
              class="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              type="number"
              min="0"
              step="1"
              bind:value={valueInput}
            />
            <button
              class="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
              on:click={handleSave}
              disabled={submitting}
            >
              {#if submitting}
                Menyimpan...
              {:else}
                Simpan Nilai
              {/if}
            </button>
          </div>
          {#if errorMessage}
            <p class="text-sm text-rose-500">{errorMessage}</p>
          {/if}
          {#if successMessage}
            <p class="text-sm text-emerald-500">{successMessage}</p>
          {/if}
        </div>
      {/if}
    </section>

    <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
      <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">Informasi Aktivitas</h3>
      <dl class="grid grid-cols-1 gap-4 text-sm text-slate-700 dark:text-slate-200">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Tanggal</dt>
          <dd class="font-medium">{formatDate(activity.activity_date)}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Project</dt>
          <dd class="font-medium">
            {#if activity.project}
              <a href={`/projects/${activity.project.id}`} class="font-medium text-violet-700 hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-100">{activity.project.name}</a>
            {:else}
              <span class="text-slate-500 dark:text-slate-400">-</span>
            {/if}
          </dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Jenis</dt>
          <dd class="font-medium">{activity.jenis}</dd>
        </div>
        {#if (activity.jenis === 'Customer' || activity.jenis === 'Vendor') && activity.mitra}
          <div>
            <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{activity.jenis}</dt>
            <dd class="font-medium">{activity.mitra.nama}</dd>
          </div>
        {/if}
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Deskripsi</dt>
          <dd class="font-medium whitespace-pre-line">{activity.description || '-'}</dd>
        </div>
      </dl>
    </section>

    <section class="rounded-2xl border border-dashed border-black/10 dark:border-white/15 p-5 bg-gradient-to-br from-black/2 to-white/5 dark:from-white/5 dark:to-transparent">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">Lampiran</h3>
        {#if attachments.length}
          <span class="text-[11px] text-slate-700 dark:text-slate-200">{attachments.length} file</span>
        {/if}
      </div>
      {#if attachments.length}
        <ul class="mt-4 border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10">
          {#each attachments as file}
            <li class="bg-white/80 dark:bg-[#0e0c19]/60 px-4 py-3">
              <div class="flex items-start gap-3">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="w-5 h-5 shrink-0 text-slate-500 mt-0.5">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z" />
                </svg>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-slate-900 dark:text-white">{file.displayName}</span>
                    {#if file.sizeLabel}<span class="shrink-0 text-xs text-slate-500 dark:text-slate-400">{file.sizeLabel}</span>{/if}
                  </div>
                  {#if file.desc}<p class="mt-1 text-xs text-slate-600 dark:text-slate-300">{file.desc}</p>{/if}
                </div>
                <div class="shrink-0">
                  <a href={file.url} target="_blank" rel="noopener" download
                    class="inline-flex items-center justify-center rounded-md p-1.5 border border-black/10 dark:border-white/10
                        hover:bg-violet-600/10 text-violet-700 dark:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                    aria-label={`Download ${file.displayName}`} title={`Download ${file.displayName}`}>
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 21h14" /></svg>
                    <span class="sr-only">Download</span>
                  </a>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">Tidak ada lampiran untuk aktivitas ini.</p>
      {/if}
    </section>
  </div>
{:else}
  <div class="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
    Pilih data keuangan untuk melihat detail.
  </div>
{/if}
