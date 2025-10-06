<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';

  export let show: boolean = false;
  export let title: string = 'Barang Certificate';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'barang_certificate';
  export let showMitra: boolean = true;

  export let form: {
    name: string;
    no_seri: string;
    mitra_id: number | '' | null;
  };

  export let mitras: Array<{ id: number; nama: string }> = [];
  export let onSubmit: () => Promise<void> | void;

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
        <label for="{idPrefix}_name" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Nama</label>
        <div class="mt-2">
          <input
            id="{idPrefix}_name"
            type="text"
            bind:value={form.name}
            required
            placeholder="Masukkan nama barang certificate"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_no_seri" class="block text-sm/6 font-medium text-gray-900 dark:text-white">No. Seri</label>
        <div class="mt-2">
          <input
            id="{idPrefix}_no_seri"
            type="text"
            bind:value={form.no_seri}
            required
            placeholder="Masukkan no seri barang certificate"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                   outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      {#if showMitra}
        <div>
          <label for="{idPrefix}_mitra" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Mitra</label>
          <div class="mt-2">
            <select
              id="{idPrefix}_mitra"
              bind:value={form.mitra_id}
              required
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100
                     outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700
                     focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            >
              <option value="">Pilih Mitra</option>
              {#each mitras as m}
                <option value={m.id}>{m.nama}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}
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
