<script lang="ts" context="module">
  export type MitraOption = { id: number; nama: string };
</script>

<script lang="ts">
  import FilterSection from './FilterSection.svelte';
  import { createEventDispatcher } from 'svelte';

  export let mitras: MitraOption[] = [];
  export let mitraValue: number | '' = '';
  export let sortDir: 'desc'|'asc' = 'desc';

  const dispatch = createEventDispatcher<{
    update: { key: 'mitra' | 'sortDir', value: any };
    clear: void;
  }>();

  function updateMitra(val: string) {
    const parsed = val === '' ? '' : Number(val);
    dispatch('update', { key: 'mitra', value: (val === '' || Number.isNaN(parsed)) ? '' : parsed });
  }
</script>

<div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-4 space-y-4">

  <!-- ⬇️ NEW: SORTIR -->
  <FilterSection title="Sortir" startOpen>
    <div class="inline-flex w-full rounded-md overflow-hidden border border-black/5 dark:border-white/10">
      <button
        type="button"
        on:click={() => dispatch('update', { key:'sortDir', value:'desc' })}
        class="w-full px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
               {sortDir==='desc' ? 'bg-indigo-600 text-white' : 'bg-white/70 text-slate-900 dark:bg-[#12101d]/70 dark:text-slate-100'}">
        Terbaru
      </button>
      <button
        type="button"
        on:click={() => dispatch('update', { key:'sortDir', value:'asc' })}
        class="w-full px-3 py-1.5 text-sm font-semibold transition-colors border-l border-black/5 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
               {sortDir==='asc' ? 'bg-indigo-600 text-white' : 'bg-white/70 text-slate-900 dark:bg-[#12101d]/70 dark:text-slate-100'}">
        Terlama
      </button>
    </div>
  </FilterSection>

  <FilterSection title="Mitra" startOpen>
    <div class="space-y-1">
      <span class="block text-xs text-slate-600 dark:text-slate-300">Pilih Mitra</span>
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
