<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  export let show: boolean = false;
  export let title: string = 'Form Aktivitas';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'activity';
  export let allowRemoveAttachment: boolean = true;
  export let showProjectSelect: boolean = true;

  export let form: {
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
    attachments?: File[];
    attachment_names?: string[];
    attachment_descriptions?: string[];
    existing_attachments?: Array<{ id: number; name: string; description?: string; url: string; size?: number; original_name?: string }>;
    removed_existing_ids?: number[];
  };

  const MAX_SHORT_DESC = 80;
  $: shortDescLen = form.short_desc?.length ?? 0;

  export let projects: Array<{ id: number; name: string; mitra?: { id: number; nama: string } }> = [];
  export let vendors: Array<{ id: number; nama: string }> = [];

  export let activityKategoriList: string[] = [];
  export let activityJenisList: string[] = [];

  export let onSubmit: () => Promise<void> | void;

  $: selectedProject = projects.find((p) => p.id === Number(form.project_id));

  let isSubmitting = false;
  async function handleSubmit() {
    if (isSubmitting) return;
    isSubmitting = true;
    try { await onSubmit?.(); }
    finally { isSubmitting = false; }
  }

  function formatFileSize(bytes: number): string {
    if (!bytes) return '';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
</script>

<Modal bind:show={show} {title} maxWidth="max-w-xl">
  {#if form.project_id}
    <div class="text-center mb-4">
      <div class="text-sm font-semibold">Project: <span class="text-violet-700 dark:text-violet-300">{selectedProject?.name}</span></div>
      {#if selectedProject?.mitra?.nama}
        <div class="text-sm">Customer: <span class="text-violet-700 dark:text-violet-300">{selectedProject?.mitra?.nama}</span></div>
      {/if}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} autocomplete="off" class="space-y-4">
    <fieldset disabled={isSubmitting} class="space-y-4">
      <div>
        <label for="{idPrefix}_name" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Nama Aktivitas</label>
        <input
          id="{idPrefix}_name" type="text" bind:value={form.name} required placeholder="Masukkan nama aktivitas"
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {#if showProjectSelect}
        <div>
          <label for="{idPrefix}_project_id" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Project</label>
          <select
            id="{idPrefix}_project_id" bind:value={form.project_id} required
            class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                   bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Pilih Project</option>
            {#each projects as project (project.id)}
              <option value={project.id}>{project.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div>
        <label for="{idPrefix}_jenis" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Jenis</label>
        <select
          id="{idPrefix}_jenis" bind:value={form.jenis} required
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Pilih Jenis</option>
          {#each activityJenisList as jenis}<option value={jenis}>{jenis}</option>{/each}
        </select>
        {#if form.jenis === 'Customer'}
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Customer otomatis berdasarkan Project.</p>
        {/if}
      </div>

      {#if form.jenis === 'Vendor'}
        <div>
          <label for="{idPrefix}_mitra_id_vendor" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Vendor</label>
          <select
            id="{idPrefix}_mitra_id_vendor" bind:value={form.mitra_id} required
            class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                   bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Pilih Vendor</option>
            {#each vendors as v (v.id)}<option value={v.id}>{v.nama}</option>{/each}
          </select>
        </div>
      {/if}

      <div>
        <label for="{idPrefix}_kategori" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Kategori</label>
        <select
          id="{idPrefix}_kategori" bind:value={form.kategori} required
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Pilih Kategori</option>
          {#each activityKategoriList as k}<option value={k}>{k}</option>{/each}
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="{idPrefix}_from" class="block text-sm font-medium text-slate-900 dark:text-slate-100">From (Opsional)</label>
          <input
            id="{idPrefix}_from" bind:value={form.from} placeholder="Dari"
            class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                   bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label for="{idPrefix}_to" class="block text-sm font-medium text-slate-900 dark:text-slate-100">To (Opsional)</label>
          <input
            id="{idPrefix}_to" bind:value={form.to} placeholder="Ke"
            class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                   bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_short_desc" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Deskripsi Singkat (Max: 80 Karakter)</label>
        <div class="mt-2">
          <textarea
            id="{idPrefix}_short_desc"
            bind:value={form.short_desc}
            on:input={() => (form.short_desc = (form.short_desc ?? '').slice(0, MAX_SHORT_DESC))}
            rows="2"
            required
            maxlength={MAX_SHORT_DESC}
            placeholder="Masukkan deskripsi singkat"
            class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
          ></textarea>
          <div class="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {shortDescLen}/{MAX_SHORT_DESC}
          </div>
        </div>
      </div>

      <div>
        <label for="{idPrefix}_description" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Deskripsi</label>
        <textarea
          id="{idPrefix}_description" rows="4" bind:value={form.description} required placeholder="Masukkan deskripsi"
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        ></textarea>
      </div>

      <div>
        <label for="{idPrefix}_activity_date" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Tanggal Aktivitas</label>
        <input
          type="date" id="{idPrefix}_activity_date" bind:value={form.activity_date} required
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <!-- Attachment baru -->
      <FileAttachment
        id="{idPrefix}_attachments"
        label="Lampiran"
        bind:files={form.attachments}
        bind:fileNames={form.attachment_names}
        bind:fileDescriptions={form.attachment_descriptions}
        maxFiles={10}
        showRemoveButton={allowRemoveAttachment}
      />

      <!-- Attachment lama (saat edit) -->
      {#if form.existing_attachments?.length}
        <div class="mt-3 space-y-3">
          <p class="text-sm font-medium">Lampiran Lama</p>
          {#each form.existing_attachments as att (att.id)}
            <div class="rounded-xl border border-black/5 dark:border-white/10 p-3 space-y-2 bg-white/70 dark:bg-[#12101d]/70">
              <a class="truncate text-violet-700 dark:text-violet-300 hover:underline" href={att.url} target="_blank" rel="noreferrer">
                {att.original_name ?? att.name}
              </a>
              <input
                type="text" bind:value={att.name} required placeholder="Nama lampiran"
                class="w-full px-2 py-1 text-sm rounded-md border border-black/10 dark:border-white/10
                       bg-white/80 dark:bg-[#0e0c19]/80 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="text" bind:value={att.description} required placeholder="Deskripsi lampiran"
                class="w-full px-2 py-1 text-sm rounded-md border border-black/10 dark:border-white/10
                       bg-white/80 dark:bg-[#0e0c19]/80 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div class="flex items-center justify-end gap-3 text-xs">
                {#if att.size}<span class="text-slate-500 dark:text-slate-400">{formatFileSize(att.size)}</span>{/if}
                <button
                  type="button" class="text-rose-600 hover:text-rose-700"
                  on:click={() => {
                    form.removed_existing_ids = [...(form.removed_existing_ids ?? []), att.id];
                    form.existing_attachments = form.existing_attachments!.filter(x => x.id !== att.id);
                  }}
                >Hapus</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </fieldset>

    <div class="pt-2">
      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white
               hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {#if isSubmitting}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"/><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4"/></svg>
          <span>Menyimpan...</span>
        {:else}
          {submitLabel}
        {/if}
      </button>
    </div>
  </form>
</Modal>

<style>
  :global(.break-all){ word-break: break-all; overflow-wrap: anywhere; }
</style>
