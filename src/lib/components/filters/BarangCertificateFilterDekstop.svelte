<script lang="ts" context="module">
  // DIEKSPOR supaya muncul di .d.ts komponen
  export type MitraOption = { id: number; nama: string };
</script>

<script lang="ts">
  import FilterSection from './FilterSection.svelte';
  import { createEventDispatcher } from 'svelte';

  // Gunakan type yang diekspor di module context di atas
  export let mitras: MitraOption[] = [];
  export let mitraValue: number | '' = '';

  const dispatch = createEventDispatcher<{
    update: { key: 'mitra', value: number | '' };
    clear: void;
  }>();

  function updateMitra(val: string) {
    const parsed = val === '' ? '' : Number(val);
    dispatch('update', { key: 'mitra', value: (val === '' || Number.isNaN(parsed)) ? '' : parsed });
  }
</script>

<div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-4 space-y-4">
  <FilterSection title="Mitra" startOpen>
    <div class="space-y-1">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="block text-xs text-slate-600 dark:text-slate-300">Pilih Mitra</label>
      <select
        class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70"
        on:change={(e) => updateMitra((e.target as HTMLSelectElement).value)}
        value={mitraValue === '' ? '' : String(mitraValue)}
      >
        <option value="">Semua</option>
        {#each mitras as m}
          <option value={m.id}>{m.nama}</option>
        {/each}
      </select>
    </div>
  </FilterSection>

  <div class="pt-2">
    <button
      class="w-full px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5"
      on:click={() => dispatch('clear')}
    >
      Clear all
    </button>
  </div>
</div>
