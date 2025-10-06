<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';

  export let show: boolean;
  export let title: string;
  export let submitLabel: string;
  export let idPrefix: string = 'project';

  export let form: {
    name: string;
    description: string;
    status: string;
    start_date: string;
    finish_date: string | null | '';
    mitra_id: string | number | '';
    kategori: string;
    lokasi: string;
    no_po: string;
    no_so: string;
    is_cert_projects: boolean;
  };

  export let customers: Array<{ id: number; nama: string }> = [];
  export let projectStatuses: string[] = ['Ongoing', 'Prospect', 'Complete', 'Cancel'];
  export let projectKategoris: string[] = [
    'PLTS Hybrid','PLTS Ongrid','PLTS Offgrid','PJUTS All In One','PJUTS Two In One','PJUTS Konvensional'
  ];

  export let onSubmit: () => void | Promise<void>;

  let isSubmitting = false;
  async function handleSubmit() {
    if (isSubmitting) return;
    isSubmitting = true;
    try { await onSubmit?.(); }
    finally { isSubmitting = false; }
  }
</script>

<Modal bind:show={show} {title} maxWidth="max-w-xl">
  <form on:submit|preventDefault={handleSubmit} autocomplete="off">
    <fieldset disabled={isSubmitting} class="space-y-4">
      <div>
        <label for={`${idPrefix}_name`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">Nama Project</label>
        <div class="mt-2">
          <input
            type="text"
            id={`${idPrefix}_name`}
            bind:value={form.name}
            required
            placeholder="Masukkan nama project"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for={`${idPrefix}_customer_id`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">Customer</label>
        <div class="mt-2">
          <select
            id={`${idPrefix}_customer_id`}
            bind:value={form.mitra_id}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            <option value="">Pilih Customer</option>
            {#each customers as customer (customer.id)}
              <option value={customer.id}>{customer.nama}</option>
            {/each}
          </select>
        </div>
      </div>

      <div>
        <label for={`${idPrefix}_kategori`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">Kategori</label>
        <div class="mt-2">
          <select
            id={`${idPrefix}_kategori`}
            bind:value={form.kategori}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            <option value="">Pilih Kategori</option>
            {#each projectKategoris as kategori}
              <option value={kategori}>{kategori}</option>
            {/each}
          </select>
        </div>
      </div>

      <div>
        <label for={`${idPrefix}_lokasi`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">Lokasi</label>
        <div class="mt-2">
          <input
            id={`${idPrefix}_lokasi`}
            bind:value={form.lokasi}
            required
            placeholder="Masukkan lokasi project"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
        </div>
      </div>

      <div>
        <label for={`${idPrefix}_status`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">Status</label>
        <div class="mt-2">
          <select
            id={`${idPrefix}_status`}
            bind:value={form.status}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            <option value="">Pilih Status</option>
            {#each projectStatuses as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for={`${idPrefix}_no_po`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">No. PO</label>
          <div class="mt-2">
            <input
              type="text"
              id={`${idPrefix}_no_po`}
              bind:value={form.no_po}
              placeholder="No. PO / dd-mm-yyyy"
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                     outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for={`${idPrefix}_no_so`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">No. SO</label>
          <div class="mt-2">
            <input
              type="text"
              id={`${idPrefix}_no_so`}
              bind:value={form.no_so}
              placeholder="No. SO / dd-mm-yyyy"
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                     outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
      </div>

      <div>
        <label for={`${idPrefix}_description`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">Deskripsi</label>
        <div class="mt-2">
          <textarea
            id={`${idPrefix}_description`}
            bind:value={form.description}
            rows="4"
            required
            placeholder="Masukkan deskripsi project"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
        </div>
      </div>

      <div>
        <label for={`${idPrefix}_start_date`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">Tanggal Mulai</label>
        <div class="mt-2">
          <input
            type="date"
            id={`${idPrefix}_start_date`}
            bind:value={form.start_date}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for={`${idPrefix}_finish_date`} class="block text-sm/6 font-medium text-gray-900 dark:text-white">Tanggal Selesai (Opsional)</label>
        <div class="mt-2">
          <input
            type="date"
            id={`${idPrefix}_finish_date`}
            bind:value={form.finish_date}
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div class="mb-4">
        <label for={`${idPrefix}_is_cert_projects`} class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Proyek Bersertifikat?
        </label>
      
        <div class="flex items-center space-x-3">
          <!-- input sebagai peer -->
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id={`${idPrefix}_is_cert_projects`}
              bind:checked={form.is_cert_projects}
              class="sr-only peer"
            />
            <!-- track + knob via after: -->
            <div
              class="relative w-11 h-6 rounded-full transition-colors duration-200
                     bg-gray-200 dark:bg-neutral-700
                     peer-checked:bg-indigo-600
                     after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                     after:h-5 after:w-5 after:rounded-full
                     after:bg-white dark:after:bg-neutral-200
                     after:border after:border-gray-300 dark:after:border-gray-500
                     after:transition-transform after:duration-200
                     peer-checked:after:translate-x-5">
            </div>
          </label>
      
          <span class="text-sm text-gray-900 dark:text-gray-100 font-medium">
            Certificate Projects
          </span>
        </div>
      </div>      
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
