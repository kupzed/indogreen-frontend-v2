<script lang="ts">
  import FilterSection from './FilterSection.svelte';
  import { createEventDispatcher } from 'svelte';

  export let kategoriOptions: string[] = [];
  export let kategoriValue = '';
  export let sortDir: 'desc'|'asc' = 'desc'; // ⬅️ NEW

  const dispatch = createEventDispatcher<{
    update: { key: 'kategori'|'sortDir', value: any }; // ⬅️ add sortDir
    clear: void;
  }>();

  function update(key: 'kategori'|'sortDir', value: any) {
    dispatch('update', { key, value });
  }

  function cap(s: string){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
</script>

<div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-4 space-y-4">

  <!-- ⬇️ NEW: SORTIR -->
  <FilterSection title="Sortir" startOpen>
    <div class="inline-flex w-full rounded-md overflow-hidden border border-black/5 dark:border-white/10">
      <button
        type="button"
        on:click={() => update('sortDir','desc')}
        class="w-full px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
               {sortDir==='desc' ? 'bg-indigo-600 text-white' : 'bg-white/70 text-slate-900 dark:bg-[#12101d]/70 dark:text-slate-100'}">
        Terbaru
      </button>
      <button
        type="button"
        on:click={() => update('sortDir','asc')}
        class="w-full px-3 py-1.5 text-sm font-semibold transition-colors border-l border-black/5 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
               {sortDir==='asc' ? 'bg-indigo-600 text-white' : 'bg-white/70 text-slate-900 dark:bg-[#12101d]/70 dark:text-slate-100'}">
        Terlama
      </button>
    </div>
  </FilterSection>

  <FilterSection title="Kategori" startOpen>
    <div class="mt-1 flex flex-wrap gap-2">
      {#each kategoriOptions as k}
        <button
          type="button"
          on:click={() => update('kategori', kategoriValue===k ? '' : k)}
          class="px-3 py-1.5 rounded-full text-xs border border-black/5 dark:border-white/10
                 hover:bg-black/5 dark:hover:bg-white/5
                 {kategoriValue===k ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}">
          {cap(k)}
        </button>
      {/each}
    </div>
  </FilterSection>

  <div class="pt-2">
    <button class="w-full px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5"
            on:click={() => dispatch('clear')}>
      Clear all
    </button>
  </div>
</div>
