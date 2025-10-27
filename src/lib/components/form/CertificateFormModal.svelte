<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  export let show: boolean = false;
  export let title: string = 'Form Sertifikat';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'certificate';
  export let allowRemoveAttachment: boolean = true;
  export let showProjectSelect: boolean = true;
  export let onClose: (() => void) | undefined = undefined;

  export let form: {
    name: string;
    no_certificate: string;
    project_id: number | string | '' | null;
    barang_certificate_id: number | string | '' | null;
    status: string | '';
    date_of_issue: string | '';
    date_of_expired: string | '';
    // multi-file
    attachments?: File[];
    attachment_names?: string[];
    attachment_descriptions?: string[];
    existing_attachments?: Array<{ id: number; name: string; description?: string; url: string; size?: number; original_name?: string }>;
    removed_existing_ids?: number[];
  };

  function formatFileSize(bytes: number): string {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  export let projects: Array<{ id: number; name?: string; title?: string; mitra?: { id: number; nama: string; is_customer?: boolean }; }> = [];
  export let barangOptions: Array<{ id: number; name?: string; title?: string; no_seri?: string }> = [];
  export let statuses: string[] = ['Belum', 'Tidak Aktif', 'Aktif'];
  export let handleProjectChange: ((projectId: number | '' | null) => void) | undefined = undefined;

  export let onSubmit: () => void | Promise<void>;

  let isSubmitting = false;
  async function handleSubmit() {
    if (isSubmitting) return;
    isSubmitting = true;
    try { await onSubmit?.(); }
    finally { isSubmitting = false; }
  }
</script>

<Modal bind:show={show} {title} maxWidth="max-w-xl" on:close={() => onClose?.()}>
  <form on:submit|preventDefault={handleSubmit} autocomplete="off">
    <fieldset disabled={isSubmitting} class="space-y-4">
      <div>
        <label for="{idPrefix}_name" class="block text-sm font-medium text-gray-900 dark:text-white">Nama</label>
        <input
          id="{idPrefix}_name"
          type="text"
          bind:value={form.name}
          required
          placeholder="Masukkan nama sertifikat"
          class="mt-1 block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label for="{idPrefix}_no_certificate" class="block text-sm font-medium text-gray-900 dark:text-white">No Sertifikat</label>
        <input
          id="{idPrefix}_no_certificate"
          type="text"
          bind:value={form.no_certificate}
          required
          placeholder="Masukkan nomor sertifikat"
          class="mt-1 block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {#if showProjectSelect}
        <div>
          <label for="{idPrefix}_project" class="block text-sm font-medium text-gray-900 dark:text-white">Project</label>
          <select
            id="{idPrefix}_project"
            bind:value={form.project_id}
            required
            on:change={(e) =>
              handleProjectChange &&
              handleProjectChange((e.target as HTMLSelectElement).value ? Number((e.target as HTMLSelectElement).value) : '')
            }
            class="mt-1 block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                   border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Pilih Project</option>
            {#each projects as p (p.id)}
              <option value={p.id}>{p.name ?? p.title}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div>
        <label for="{idPrefix}_barang_certificate" class="block text-sm font-medium text-gray-900 dark:text-white">Barang Certificate</label>
        <select
          id="{idPrefix}_barang_certificate"
          bind:value={form.barang_certificate_id}
          required
          class="mt-1 block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          disabled={barangOptions.length === 0}
        >
          <option value="">{barangOptions.length === 0 ? 'Pilih Project terlebih dahulu' : 'Pilih Barang Certificate'}</option>
          {#each barangOptions as b (b.id)}
            <option value={b.id}>{b.name ?? b.title} {#if b.no_seri}- {b.no_seri}{/if}</option>
          {/each}
        </select>
        {#if (showProjectSelect ? form.project_id : true) && barangOptions.length === 0}
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Tidak ada Barang Certificate untuk Project ini</p>
        {/if}
      </div>

      <div>
        <label for="{idPrefix}_status" class="block text-sm font-medium text-gray-900 dark:text-white">Status</label>
        <select
          id="{idPrefix}_status"
          bind:value={form.status}
          required
          class="mt-1 block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Pilih Status</option>
          {#each statuses as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="{idPrefix}_issue" class="block text-sm font-medium text-gray-900 dark:text-white">Tanggal Terbit</label>
          <input
            id="{idPrefix}_issue"
            type="date"
            bind:value={form.date_of_issue}
            class="mt-1 block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                   border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label for="{idPrefix}_expired" class="block text-sm font-medium text-gray-900 dark:text-white">Tanggal Expired</label>
          <input
            id="{idPrefix}_expired"
            type="date"
            bind:value={form.date_of_expired}
            class="mt-1 block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                   border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <!-- Attachment (multi-file) -->
      <FileAttachment
        id="{idPrefix}_attachments"
        label="Lampiran"
        bind:files={form.attachments}
        bind:fileNames={form.attachment_names}
        bind:fileDescriptions={form.attachment_descriptions}
        maxFiles={10}
        showRemoveButton={allowRemoveAttachment}
      />

      <!-- Lampiran lama (opsional saat edit) -->
      {#if form.existing_attachments && form.existing_attachments.length > 0}
        <div class="mt-3 space-y-3">
          <p class="text-sm font-medium text-gray-900 dark:text-white">Lampiran Lama</p>
          {#each form.existing_attachments as att, i (att.id)}
            <div class="rounded border px-3 py-2 text-sm dark:border-gray-700 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <a
                  class="truncate text-indigo-600 dark:text-indigo-400 hover:underline"
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {att.original_name ?? att.name}
                </a>
              </div>
              <!-- Editable name for existing attachment -->
              <input
                type="text"
                bind:value={att.name}
                required
                placeholder="Nama lampiran"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <!-- Editable description for existing attachment -->
              <input
                type="text"
                bind:value={att.description}
                required
                placeholder="Deskripsi lampiran"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div class="flex items-center justify-end gap-3">
                  {#if att.size}
                    <span class="text-gray-500 dark:text-gray-400">{formatFileSize(att.size)}</span>
                  {/if}
                  <button
                    type="button"
                    class="text-red-600 hover:text-red-700"
                    on:click={() => {
                      form.removed_existing_ids = [...(form.removed_existing_ids ?? []), att.id];
                      form.existing_attachments = form.existing_attachments!.filter(x => x.id !== att.id);
                    }}
                  >
                    Hapus
                  </button>
                </div>
            </div>
          {/each}
        </div>
      {/if}
    </fieldset>

    <div>
      <button
        type="submit"
        class="w-full justify-center rounded-md bg-indigo-600 mt-5 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700
               disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {#if isSubmitting}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4" />
          </svg>
          <span>Menyimpan...</span>
        {:else}
          {submitLabel}
        {/if}
      </button>
    </div>
  </form>
</Modal>
