<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  // Bindable props
  export let show: boolean = false;
  export let title: string = 'Form Sertifikat';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'certificate';

  // Control whether project select is shown (hide on project detail page)
  export let showProjectSelect: boolean = true;

  // Allow removing existing attachment (edit mode)
  export let allowRemoveAttachment: boolean = false;

  // Forward close handler (optional)
  export let onClose: (() => void) | undefined = undefined;

  // Form object (mutated by inputs directly)
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

  // Options
  export let projects: Array<{
    id: number;
    name?: string;
    title?: string;
    mitra?: { id: number; nama: string; is_customer?: boolean };
  }> = [];
  export let barangOptions: Array<{ id: number; name?: string; title?: string; no_seri?: string }> = [];
  export let statuses: string[] = ['Belum', 'Tidak Aktif', 'Aktif'];

  // Optional callback when project changes (used in listing page to refetch barang options)
  export let handleProjectChange: ((projectId: number | '' | null) => void) | undefined = undefined;

  // Optional current file name for display
  export let currentFileName: string = '';

  // Submit handler provided by parent
  export let onSubmit: () => void | Promise<void>;

</script>

<Modal bind:show={show} {title} maxWidth="max-w-xl" on:close={() => onClose?.()}>
  <form on:submit|preventDefault={onSubmit}>
    <div class="space-y-4">
      <!-- Name -->
      <div>
        <label for="{idPrefix}_name" class="block text-sm font-medium text-gray-900">Nama</label>
        <input
          id="{idPrefix}_name"
          type="text"
          bind:value={form.name}
          required
          placeholder="Masukkan nama sertifikat"
          class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <!-- No Certificate -->
      <div>
        <label for="{idPrefix}_no_certificate" class="block text-sm font-medium text-gray-900">No Sertifikat</label>
        <input
          id="{idPrefix}_no_certificate"
          type="text"
          bind:value={form.no_certificate}
          required
          placeholder="Masukkan nomor sertifikat"
          class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {#if showProjectSelect}
        <div>
          <label for="{idPrefix}_project" class="block text-sm font-medium text-gray-900">Project</label>
          <select
            id="{idPrefix}_project"
            bind:value={form.project_id}
            required
            on:change={(e) => handleProjectChange && handleProjectChange((e.target as HTMLSelectElement).value ? Number((e.target as HTMLSelectElement).value) : '')}
            class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Pilih Project</option>
            {#each projects as p (p.id)}
              <option value={p.id}>{p.name ?? p.title}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div>
        <label for="{idPrefix}_barang_certificate" class="block text-sm font-medium text-gray-900">Barang Certificate</label>
        <select
          id="{idPrefix}_barang_certificate"
          bind:value={form.barang_certificate_id}
          required
          class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          disabled={barangOptions.length === 0}
        >
          <option value="">{barangOptions.length === 0 ? 'Pilih Project terlebih dahulu' : 'Pilih Barang Certificate'}</option>
          {#each barangOptions as b (b.id)}
            <option value={b.id}>{b.name ?? b.title} {#if b.no_seri}- {b.no_seri}{/if}</option>
          {/each}
        </select>
        {#if (showProjectSelect ? form.project_id : true) && barangOptions.length === 0}
          <p class="mt-1 text-sm text-gray-500">Tidak ada Barang Certificate untuk Project ini</p>
        {/if}
      </div>

      <div>
        <label for="{idPrefix}_status" class="block text-sm font-medium text-gray-900">Status</label>
        <select
          id="{idPrefix}_status"
          bind:value={form.status}
          required
          class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Pilih Status</option>
          {#each statuses as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="{idPrefix}_issue" class="block text-sm font-medium text-gray-900">Tanggal Terbit</label>
          <input id="{idPrefix}_issue" type="date" bind:value={form.date_of_issue} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label for="{idPrefix}_expired" class="block text-sm font-medium text-gray-900">Tanggal Expired</label>
          <input id="{idPrefix}_expired" type="date" bind:value={form.date_of_expired} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
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
    </div>

    <div>
      <button type="submit" class="w-full justify-center rounded-md bg-indigo-600 mt-5 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{submitLabel}</button>
    </div>
  </form>
</Modal>
