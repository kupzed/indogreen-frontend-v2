<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FilterSection from './FilterSection.svelte';
  import { fly, fade } from 'svelte/transition';

  export let open = false;

  export let kategoriOptions: string[] = [];
  export let kategoriValue = '';
  export let sortDir: 'desc'|'asc' = 'desc'; // ⬅️ NEW

  const dispatch = createEventDispatcher<{
    update: { key: 'kategori'|'sortDir', value: any }, // ⬅️ add sortDir
    clear: void,
    apply: void,
    close: void
  }>();

  function update(key: 'kategori'|'sortDir', value: any) {
    dispatch('update', { key, value });
  }

  function cap(s: string){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
</script>

{#if open}
  <div class="fixed inset-0 z-50" role="dialog" aria-modal="true">
    <button transition:fade={{ duration: 250 }} class="absolute inset-0 bg-black/50" on:click={() => dispatch('close')} aria-label="Tutup"></button>

    <div in:fly={{ y: 300, duration: 300, opacity: 0 }} out:fly={{ y: 300, duration: 250, opacity: 0 }}
         class="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur p-4 max-h-[85vh] overflow-y-auto overscroll-contain">

      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">Filters</h3>
        <button class="h-9 w-9 grid place-items-center rounded-xl border border-black/5 dark:border-white/10" on:click={() => dispatch('close')} aria-label="Tutup">✕</button>
      </div>

      <div class="space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar">
        <!-- ⬇️ NEW: SORTIR -->
        <FilterSection title="Sortir">
          <div class="inline-flex w-full rounded-md overflow-hidden border border-black/5 dark:border-white/10">
            <button
              type="button"
              on:click={() => update('sortDir','desc')}
              class="w-full px-3 py-1.5 text-sm font-semibold transition-colors
                     {sortDir==='desc' ? 'bg-indigo-600 text-white' : 'bg-white/70 text-slate-900 dark:bg-[#12101d]/70 dark:text-slate-100'}">
              Create: Terbaru
            </button>
            <button
              type="button"
              on:click={() => update('sortDir','asc')}
              class="w-full px-3 py-1.5 text-sm font-semibold transition-colors border-l border-black/5 dark:border-white/10
                     {sortDir==='asc' ? 'bg-indigo-600 text-white' : 'bg-white/70 text-slate-900 dark:bg-[#12101d]/70 dark:text-slate-100'}">
              Create: Terlama
            </button>
          </div>
        </FilterSection>

        <FilterSection title="Kategori" showClear={!!kategoriValue} on:clear={() => update('kategori','')}>
          <div class="mt-2 flex flex-wrap gap-2">
            {#each kategoriOptions as k}
              <button type="button"
                on:click={() => update('kategori', kategoriValue === k ? '' : k)}
                class="px-3 py-1.5 rounded-full text-xs border border-black/5 dark:border-white/10
                       hover:bg-black/5 dark:hover:bg-white/5
                       {kategoriValue===k ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}">
                {cap(k)}
              </button>
            {/each}
          </div>
        </FilterSection>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <button class="px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5"
                on:click={() => dispatch('clear')}>Clear all</button>
        <button class="px-3 py-2 text-sm font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700"
                on:click={() => dispatch('apply')}>Done</button>
      </div>
    </div>
  </div>
{/if}
