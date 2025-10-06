<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';

  export let show: boolean = false;
  export let title: string = 'Mitra';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'mitra';

  export let form: {
    nama: string;
    is_pribadi: boolean;
    is_perusahaan: boolean;
    is_customer: boolean;
    is_vendor: boolean;
    alamat: string;
    website: string;
    email: string;
    kontak_1: string;
    kontak_1_nama: string;
    kontak_1_jabatan: string;
    kontak_2: string;
    kontak_2_nama: string;
    kontak_2_jabatan: string;
  };

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
        <label for="{idPrefix}_nama" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Nama</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_nama"
            bind:value={form.nama}
            required
            placeholder="Masukkan nama mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm/6 font-medium text-gray-900 dark:text-white">Kategori</label>
        <div class="flex flex-wrap gap-4 mt-2 text-gray-900 dark:text-gray-100">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" bind:checked={form.is_pribadi} class="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded" />
            <span>Pribadi</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" bind:checked={form.is_perusahaan} class="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded" />
            <span>Perusahaan</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" bind:checked={form.is_customer} class="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded" />
            <span>Customer</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" bind:checked={form.is_vendor} class="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded" />
            <span>Vendor</span>
          </label>
        </div>
      </div>

      <div>
        <label for="{idPrefix}_alamat" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Alamat</label>
        <div class="mt-2">
          <textarea
            id="{idPrefix}_alamat"
            bind:value={form.alamat}
            rows="2"
            required
            placeholder="Masukkan alamat mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
        </div>
      </div>

      <div>
        <label for="{idPrefix}_website" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Website</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_website"
            bind:value={form.website}
            placeholder="Masukkan website mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_email" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Email</label>
        <div class="mt-2">
          <input
            type="email"
            id="{idPrefix}_email"
            bind:value={form.email}
            placeholder="Masukkan email mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_kontak_1" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Kontak 1 (No. Telp/HP)</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_kontak_1"
            bind:value={form.kontak_1}
            placeholder="Masukkan kontak 1 mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_kontak_1_nama" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Nama Kontak 1</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_kontak_1_nama"
            bind:value={form.kontak_1_nama}
            placeholder="Masukkan nama kontak 1 mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_kontak_1_jabatan" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Jabatan Kontak 1</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_kontak_1_jabatan"
            bind:value={form.kontak_1_jabatan}
            placeholder="Masukkan jabatan kontak 1 mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_kontak_2" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Kontak 2 (No. Telp/HP)</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_kontak_2"
            bind:value={form.kontak_2}
            placeholder="Masukkan kontak 2 mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_kontak_2_nama" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Nama Kontak 2</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_kontak_2_nama"
            bind:value={form.kontak_2_nama}
            placeholder="Masukkan nama kontak 2 mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_kontak_2_jabatan" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Jabatan Kontak 2</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_kontak_2_jabatan"
            bind:value={form.kontak_2_jabatan}
            placeholder="Masukkan jabatan kontak 2 mitra"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
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
