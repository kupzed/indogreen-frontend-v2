<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';

  export let show: boolean = false; // bindable
  export let title: string = 'Barang Certificate';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'barang_certificate';

  // When true, show the Mitra select; when false, omit it (e.g., on Mitra detail page)
  export let showMitra: boolean = true;

  // Form object is passed by reference; inputs will mutate it
  export let form: {
    name: string;
    no_seri: string;
    mitra_id: number | '' | null;
  };

  // Optional mitra options (required when showMitra is true)
  export let mitras: Array<{ id: number; nama: string }> = [];

  // Submit handler provided by parent
  export let onSubmit: () => void;
</script>

<Modal bind:show={show} {title} maxWidth="max-w-xl">
  <form on:submit|preventDefault={onSubmit}>
    <div class="space-y-4">
      <div>
        <label for="{idPrefix}_name" class="block text-sm/6 font-medium text-gray-900">Nama</label>
        <div class="mt-2">
          <input
            id="{idPrefix}_name"
            type="text"
            bind:value={form.name}
            required
            placeholder="Masukkan nama barang certificate"
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <div>
        <label for="{idPrefix}_no_seri" class="block text-sm/6 font-medium text-gray-900">No. Seri</label>
        <div class="mt-2">
          <input
            id="{idPrefix}_no_seri"
            type="text"
            bind:value={form.no_seri}
            required
            placeholder="Masukkan no seri barang certificate"
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      {#if showMitra}
        <div>
          <label for="{idPrefix}_mitra" class="block text-sm/6 font-medium text-gray-900">Mitra</label>
          <div class="mt-2">
            <select
              id="{idPrefix}_mitra"
              bind:value={form.mitra_id}
              required
              class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            >
              <option value="">Pilih Mitra</option>
              {#each mitras as m}
                <option value={m.id}>{m.nama}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}
    </div>

    <div class="mt-6">
      <button
        type="submit"
        class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {submitLabel}
      </button>
    </div>
  </form>
</Modal>
