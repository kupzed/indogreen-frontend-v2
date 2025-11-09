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
  <form on:submit|preventDefault={handleSubmit} autocomplete="off" class="space-y-4">
    <fieldset disabled={isSubmitting} class="space-y-4">
      <div>
        <label for="{idPrefix}_name" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Nama</label>
        <input
          id="{idPrefix}_name"
          type="text"
          bind:value={form.name}
          required
          placeholder="Masukkan nama barang certificate"
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label for="{idPrefix}_no_seri" class="block text-sm font-medium text-slate-900 dark:text-slate-100">No. Seri</label>
        <input
          id="{idPrefix}_no_seri"
          type="text"
          bind:value={form.no_seri}
          required
          placeholder="Masukkan no seri barang certificate"
          class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                 bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {#if showMitra}
        <div>
          <label for="{idPrefix}_mitra" class="block text-sm font-medium text-slate-900 dark:text-slate-100">Mitra</label>
          <select
            id="{idPrefix}_mitra"
            bind:value={form.mitra_id}
            required
            class="mt-1 block w-full rounded-md border border-black/10 dark:border-white/10
                   bg-white/80 dark:bg-[#0e0c19]/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Pilih Mitra</option>
            {#each mitras as m}<option value={m.id}>{m.nama}</option>{/each}
          </select>
        </div>
      {/if}
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
