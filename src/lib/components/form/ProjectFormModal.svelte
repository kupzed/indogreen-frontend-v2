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
  export let projectStatuses: string[] = [];
  export let projectKategoris: string[] = [];

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
  <form on:submit|preventDefault={handleSubmit} autocomplete="off" class="space-y-4">
    <fieldset disabled={isSubmitting} class="space-y-4">
      <div>
        <label for={`${idPrefix}_name`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">Nama Project</label>
        <input
          type="text"
          id={`${idPrefix}_name`}
          bind:value={form.name}
          required
          placeholder="Masukkan nama project"
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label for={`${idPrefix}_customer_id`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">Customer</label>
        <select
          id={`${idPrefix}_customer_id`}
          bind:value={form.mitra_id}
          required
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Pilih Customer</option>
          {#each customers as customer (customer.id)}
            <option value={customer.id}>{customer.nama}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for={`${idPrefix}_kategori`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">Kategori</label>
        <select
          id={`${idPrefix}_kategori`}
          bind:value={form.kategori}
          required
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Pilih Kategori</option>
          {#each projectKategoris as kategori}
            <option value={kategori}>{kategori}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for={`${idPrefix}_lokasi`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">Lokasi</label>
        <input
          id={`${idPrefix}_lokasi`}
          bind:value={form.lokasi}
          required
          placeholder="Masukkan lokasi project"
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label for={`${idPrefix}_status`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">Status</label>
        <select
          id={`${idPrefix}_status`}
          bind:value={form.status}
          required
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Pilih Status</option>
          {#each projectStatuses as status}
            <option value={status}>{status}</option>
          {/each}
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for={`${idPrefix}_no_po`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">No. PO</label>
          <input
            type="text"
            id={`${idPrefix}_no_po`}
            bind:value={form.no_po}
            placeholder="No. PO / dd-mm-yyyy"
            class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                   bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label for={`${idPrefix}_no_so`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">No. SO</label>
          <input
            type="text"
            id={`${idPrefix}_no_so`}
            bind:value={form.no_so}
            placeholder="No. SO / dd-mm-yyyy"
            class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                   bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      <div>
        <label for={`${idPrefix}_description`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">Deskripsi</label>
        <textarea
          id={`${idPrefix}_description`}
          bind:value={form.description}
          rows="4"
          required
          placeholder="Masukkan deskripsi project"
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        ></textarea>
      </div>

      <div>
        <label for={`${idPrefix}_start_date`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">Tanggal Mulai</label>
        <input
          type="date"
          id={`${idPrefix}_start_date`}
          bind:value={form.start_date}
          required
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label for={`${idPrefix}_finish_date`} class="block text-sm font-medium text-slate-900 dark:text-slate-100">Tanggal Selesai (Opsional)</label>
        <input
          type="date"
          id={`${idPrefix}_finish_date`}
          bind:value={form.finish_date}
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div class="mb-2">
        <label for={`${idPrefix}_is_cert_projects`} class="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Proyek Bersertifikat?
        </label>
        <label class="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            id={`${idPrefix}_is_cert_projects`}
            bind:checked={form.is_cert_projects}
            class="sr-only peer"
          />
          <div
            class="relative w-11 h-6 rounded-full transition-colors duration-200
                   bg-slate-200 dark:bg-neutral-700
                   peer-checked:bg-violet-600
                   after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                   after:h-5 after:w-5 after:rounded-full
                   after:bg-white dark:after:bg-neutral-200
                   after:border after:border-slate-300 dark:after:border-neutral-500
                   after:transition-transform after:duration-200
                   peer-checked:after:translate-x-5">
          </div>
          <span class="ml-3 text-sm text-slate-900 dark:text-slate-100">Certificate Projects</span>
        </label>
      </div>
    </fieldset>

    <div class="pt-2">
      <button
        type="submit"
        class="flex w-full justify-center items-center gap-2 rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white
               hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500
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
