<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  // Bindable props
  export let show: boolean = false;
  export let title: string = 'Form Aktivitas';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'activity';

  // Controls whether attachment can be removed (used on edit)
  export let allowRemoveAttachment: boolean = false;

  // Control whether project select is shown (hide on project detail page)
  export let showProjectSelect: boolean = true;

  // Form object is passed by reference; inputs will mutate it directly
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

  // Options
  export let projects: Array<{
    id: number;
    name: string;
    mitra_id?: number | null;
    mitra?: { id: number; nama: string; is_customer?: boolean };
  }> = [];
  export let vendors: Array<{ id: number; nama: string }> = [];

  // Dropdown lists (fixed)
  const activityKategoriList = [
    'Expense Report','Invoice','Purchase Order','Payment','Quotation',
    'Faktur Pajak','Kasbon','Laporan Teknis','Surat Masuk','Surat Keluar','Kontrak'
  ];
  const activityJenisList = ['Internal', 'Customer', 'Vendor'];

  // Optional current file name for display on edit
  export let currentFileName: string = '';

  // Submit handler provided by parent
  export let onSubmit: () => void;

  // Ensure type-safe match between select-bound project_id (string) and projects[].id (number)
  $: selectedProject = projects.find((project) => project.id === Number(form.project_id));
</script>

<Modal bind:show={show} {title} maxWidth="max-w-xl">
  {#if form.project_id}
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900">
        Project : {selectedProject?.name}
    </h1>
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900 mb-6">
        Customer : {selectedProject?.mitra?.nama}
    </h1>
  {/if}
  <form on:submit|preventDefault={onSubmit}>
    <div class="space-y-4">
      <!-- Name -->
      <div>
        <label for="{idPrefix}_name" class="block text-sm/6 font-medium text-gray-900">Nama Aktivitas</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_name"
            bind:value={form.name}
            required
            placeholder="Masukkan nama aktivitas"
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <!-- Project -->
      {#if showProjectSelect}
        <div>
          <label for="{idPrefix}_project_id" class="block text-sm/6 font-medium text-gray-900">Project</label>
          <div class="mt-2">
            <select
              id="{idPrefix}_project_id"
              bind:value={form.project_id}
              required
              class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
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
        <label for="{idPrefix}_jenis" class="block text-sm/6 font-medium text-gray-900">Jenis</label>
        <div class="mt-2">
          <select
            id="{idPrefix}_jenis"
            bind:value={form.jenis}
            required
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
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
        <p class="text-sm text-gray-500">Customer akan otomatis dipilih berdasarkan Project.</p>
      {:else if form.jenis === 'Vendor'}
        <div>
          <label for="{idPrefix}_mitra_id_vendor" class="block text-sm/6 font-medium text-gray-900">Vendor</label>
          <div class="mt-2">
            <select
              id="{idPrefix}_mitra_id_vendor"
              bind:value={form.mitra_id}
              required
              class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
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
        <label for="{idPrefix}_kategori" class="block text-sm/6 font-medium text-gray-900">Kategori</label>
        <div class="mt-2">
          <select
            id="{idPrefix}_kategori"
            bind:value={form.kategori}
            required
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
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
          <label for="{idPrefix}_from" class="block text-sm/6 font-medium text-gray-900">From (Optional)</label>
          <div class="mt-2">
            <input
              id="{idPrefix}_from"
              bind:value={form.from}
              placeholder="Dari"
              class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
        <div>
          <label for="{idPrefix}_to" class="block text-sm/6 font-medium text-gray-900">To (Optional)</label>
          <div class="mt-2">
            <input
              id="{idPrefix}_to"
              bind:value={form.to}
              placeholder="Ke"
              class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label for="{idPrefix}_description" class="block text-sm/6 font-medium text-gray-900">Deskripsi</label>
        <div class="mt-2">
          <textarea
            id="{idPrefix}_description"
            bind:value={form.description}
            rows="4"
            required
            placeholder="Masukkan deskripsi aktivitas"
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          ></textarea>
        </div>
      </div>

      <!-- Activity Date -->
      <div>
        <label for="{idPrefix}_activity_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Aktivitas</label>
        <div class="mt-2">
          <input
            type="date"
            id="{idPrefix}_activity_date"
            bind:value={form.activity_date}
            required
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
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
    </div>

    <div class="mt-6">
      <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        {submitLabel}
      </button>
    </div>
  </form>
</Modal>
