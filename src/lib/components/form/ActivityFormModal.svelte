<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  export let show: boolean = false;
  export let title: string = 'Form Aktivitas';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'activity';
  export let allowRemoveAttachment: boolean = false;
  export let showProjectSelect: boolean = true;

  export let form: {
    name: string;
    description: string;
    project_id: string | number | '';
    kategori: string | '';
    activity_date: string | '';
    attachment: File | null;
    jenis: string | '';
    mitra_id: number | string | '' | null;
    from?: string | '';
    to?: string | '';
    attachment_removed?: boolean;
  };

  export let projects: Array<{
    id: number;
    name: string;
    mitra_id?: number | null;
    mitra?: { id: number; nama: string; is_customer?: boolean };
  }> = [];
  export let vendors: Array<{ id: number; nama: string }> = [];

  const activityKategoriList = [
    'Expense Report','Invoice','Purchase Order','Payment','Quotation',
    'Faktur Pajak','Kasbon','Laporan Teknis','Surat Masuk','Surat Keluar','Kontrak'
  ];
  const activityJenisList = ['Internal', 'Customer', 'Vendor'];

  export let currentFileName: string = '';
  export let onSubmit: () => Promise<void> | void;

  $: selectedProject = projects.find((p) => p.id === Number(form.project_id));

  let isSubmitting = false;
  async function handleSubmit() {
    if (isSubmitting) return;
    isSubmitting = true;
    try { await onSubmit?.(); }
    finally { isSubmitting = false; }
  }
</script>

<Modal bind:show={show} {title} maxWidth="max-w-xl">
  {#if form.project_id}
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900 dark:text-white">
      Project : {selectedProject?.name}
    </h1>
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900 dark:text-white mb-6">
      Customer : {selectedProject?.mitra?.nama}
    </h1>
  {/if}

  <form on:submit|preventDefault={handleSubmit} autocomplete="off">
    <fieldset disabled={isSubmitting} class="space-y-4">
      <!-- Name -->
      <div>
        <label for="{idPrefix}_name" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Nama Aktivitas</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_name"
            bind:value={form.name}
            required
            placeholder="Masukkan nama aktivitas"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <!-- Project -->
      {#if showProjectSelect}
        <div>
          <label for="{idPrefix}_project_id" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Project</label>
          <div class="mt-2">
            <select
              id="{idPrefix}_project_id"
              bind:value={form.project_id}
              required
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                     outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                     focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            >
              <option value="">Pilih Project</option>
              {#each projects as project (project.id)}
                <option value={project.id}>{project.name}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}

      <!-- Jenis -->
      <div>
        <label for="{idPrefix}_jenis" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Jenis</label>
        <div class="mt-2">
          <select
            id="{idPrefix}_jenis"
            bind:value={form.jenis}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            <option value="">Pilih Jenis</option>
            {#each activityJenisList as jenis}
              <option value={jenis}>{jenis}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Mitra logic -->
      {#if form.jenis === 'Customer'}
        <p class="text-sm text-gray-500 dark:text-gray-400">Customer akan otomatis dipilih berdasarkan Project.</p>
      {:else if form.jenis === 'Vendor'}
        <div>
          <label for="{idPrefix}_mitra_id_vendor" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Vendor</label>
          <div class="mt-2">
            <select
              id="{idPrefix}_mitra_id_vendor"
              bind:value={form.mitra_id}
              required
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                     outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                     focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            >
              <option value="">Pilih Vendor</option>
              {#each vendors as vendor (vendor.id)}
                <option value={vendor.id}>{vendor.nama}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}

      <!-- Kategori -->
      <div>
        <label for="{idPrefix}_kategori" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Kategori</label>
        <div class="mt-2">
          <select
            id="{idPrefix}_kategori"
            bind:value={form.kategori}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            <option value="">Pilih Kategori</option>
            {#each activityKategoriList as kategori}
              <option value={kategori}>{kategori}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- From / To -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="{idPrefix}_from" class="block text-sm/6 font-medium text-gray-900 dark:text-white">From (Optional)</label>
          <div class="mt-2">
            <input
              id="{idPrefix}_from"
              bind:value={form.from}
              placeholder="Dari"
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                     outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
        <div>
          <label for="{idPrefix}_to" class="block text-sm/6 font-medium text-gray-900 dark:text-white">To (Optional)</label>
          <div class="mt-2">
            <input
              id="{idPrefix}_to"
              bind:value={form.to}
              placeholder="Ke"
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                     outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label for="{idPrefix}_description" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Deskripsi</label>
        <div class="mt-2">
          <textarea
            id="{idPrefix}_description"
            bind:value={form.description}
            rows="4"
            required
            placeholder="Masukkan deskripsi aktivitas"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          ></textarea>
        </div>
      </div>

      <!-- Activity Date -->
      <div>
        <label for="{idPrefix}_activity_date" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Tanggal Aktivitas</label>
        <div class="mt-2">
          <input
            type="date"
            id="{idPrefix}_activity_date"
            bind:value={form.activity_date}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <!-- Attachment -->
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

    <div class="mt-6">
      <button
        type="submit"
        class="flex w-full justify-center items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs
               hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
               disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {#if isSubmitting}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"></circle>
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4"></path>
          </svg>
          <span>Menyimpan...</span>
        {:else}
          {submitLabel}
        {/if}
      </button>
    </div>
  </form>
</Modal>
