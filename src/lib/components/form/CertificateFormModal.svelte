<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  export let show: boolean = false;
  export let title: string = 'Form Sertifikat';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'certificate';
  export let showProjectSelect: boolean = true;
  export let allowRemoveAttachment: boolean = false;
  export let onClose: (() => void) | undefined = undefined;

  export let form: {
    name: string;
    no_certificate: string;
    project_id: number | string | '' | null;
    barang_certificate_id: number | string | '' | null;
    status: string | '';
    date_of_issue: string | '';
    date_of_expired: string | '';
    attachment: File | null;
    attachment_removed?: boolean;
  };

  export let projects: Array<{ id: number; name?: string; title?: string; mitra?: { id: number; nama: string; is_customer?: boolean }; }> = [];
  export let barangOptions: Array<{ id: number; name?: string; title?: string; no_seri?: string }> = [];
  export let statuses: string[] = ['Belum', 'Tidak Aktif', 'Aktif'];
  export let handleProjectChange: ((projectId: number | '' | null) => void) | undefined = undefined;
  export let currentFileName: string = '';
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

      <FileAttachment
        id="{idPrefix}_attachment"
        label="Lampiran"
        bind:file={form.attachment}
        bind:fileName={currentFileName}
        showRemoveButton={allowRemoveAttachment}
        on:change={(e) => {
          form.attachment = e.detail.file;
          currentFileName = e.detail.fileName;
          if (form.attachment_removed !== undefined) form.attachment_removed = false;
        }}
        on:remove={() => {
          if (allowRemoveAttachment) {
            form.attachment_removed = true;
            form.attachment = null;
            currentFileName = '';
          }
        }}
      />
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
