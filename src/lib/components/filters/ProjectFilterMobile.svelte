<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FilterSection from './FilterSection.svelte';
  import { fly, fade } from 'svelte/transition';

  export let open = false;

  export let statusOptions: string[] = [];
  export let kategoriOptions: string[] = [];
  export let statusValue = '';
  export let kategoriValue = '';
  export let certValue = false;
  export let dateFrom = '';
  export let dateTo = '';

  // NEW: sorting props
  export let sortBy: 'created'|'start_date' = 'created';
  export let sortDir: 'asc'|'desc' = 'desc';

  const dispatch = createEventDispatcher<{
    update: { key: 'status'|'kategori'|'cert'|'dateFrom'|'dateTo'|'sortBy'|'sortDir', value: any },
    clear: void,
    apply: void,
    close: void
  }>();

  function update(key: 'status'|'kategori'|'cert'|'dateFrom'|'dateTo'|'sortBy'|'sortDir', value: any) {
    dispatch('update', { key, value });
  }

  function setCreatedSort(dir: 'asc'|'desc') {
    update('sortBy', 'created');
    update('sortDir', dir);
  }
  function setStartDateSort(dir: 'asc'|'desc') {
    update('sortBy', 'start_date');
    update('sortDir', dir);
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50" role="dialog" aria-modal="true">
    <button
      transition:fade={{ duration: 250 }}
      class="absolute inset-0 bg-black/50"
      on:click={() => dispatch('close')}
      aria-label="Tutup"
    ></button>

    <div
      in:fly={{ y: 300, duration: 300, opacity: 0 }}
      out:fly={{ y: 300, duration: 250, opacity: 0 }}
      class="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur p-4 max-h-[85vh] overflow-y-auto overscroll-contain"
    >
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">Filters</h3>
        <button class="h-9 w-9 grid place-items-center rounded-xl border border-black/5 dark:border-white/10" on:click={() => dispatch('close')} aria-label="Tutup">✕</button>
      </div>

      <div class="space-y-4 max-h-[65vh] overflow-y-auto">
        <!-- Sortir (Create) -->
        <FilterSection title="Sortir" on:clear={() => setCreatedSort('desc')} showClear={!(sortBy==='created' && sortDir==='desc')}>
          <select
            aria-label="Sortir Create"
            class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70"
            on:change={(e) => setCreatedSort(((e.target as HTMLSelectElement).value as 'asc'|'desc'))}
          >
            <option value="desc" selected={sortBy==='created' && sortDir==='desc'}>Create: Terbaru</option>
            <option value="asc"  selected={sortBy==='created' && sortDir==='asc'}>Create: Terlama</option>
          </select>
        </FilterSection>

        <FilterSection title="Status" showClear={!!statusValue} on:clear={() => update('status','')}>
          <div class="mt-2 flex flex-wrap gap-2">
            {#each statusOptions as s}
              <button type="button"
                on:click={() => update('status', statusValue === s ? '' : s)}
                class="px-3 py-1.5 rounded-full text-xs border border-black/5 dark:border-white/10
                       hover:bg-black/5 dark:hover:bg-white/5
                       {statusValue===s ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}">
                {s}
              </button>
            {/each}
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
                {k}
              </button>
            {/each}
          </div>
        </FilterSection>

        <FilterSection title="Certificate" showClear={certValue} on:clear={() => update('cert', false)}>
          <div class="flex items-center justify-between pt-1">
            <span class="text-sm text-slate-700 dark:text-slate-200">Hanya project bersertifikat</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked={certValue}
                     on:change={(e) => update('cert', (e.target as HTMLInputElement).checked)} />
              <div class="relative w-11 h-6 rounded-full transition-colors duration-200
                          bg-gray-200 dark:bg-neutral-700 peer-checked:bg-indigo-600
                          after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                          after:h-5 after:w-5 after:rounded-full
                          after:bg-white dark:after:bg-neutral-200
                          after:border after:border-gray-300 dark:after:border-gray-500
                          after:transition-transform after:duration-200
                          peer-checked:after:translate-x-5"></div>
            </label>
          </div>
        </FilterSection>

        <FilterSection title="Tanggal" showClear={!!(dateFrom || dateTo) || sortBy==='start_date'} on:clear={() => { update('dateFrom',''); update('dateTo',''); setCreatedSort('desc'); }}>
          <div class="space-y-3">
            <!-- segmented sort -->
            <div>
              <span class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Urutkan Tanggal Dilaksanakan</span>
              <div class="inline-flex w-full rounded-xl overflow-hidden border border-black/5 dark:border-white/10" role="tablist" aria-label="Urutan tanggal dilaksanakan">
                <button
                  type="button"
                  on:click={() => setStartDateSort('desc')}
                  class="w-full px-3 py-1.5 text-sm font-semibold transition-colors
                         {sortBy==='start_date' && sortDir==='desc' ? 'bg-violet-600 text-white' : 'bg-white/70 dark:bg-[#12101d]/70 text-slate-900 dark:text-slate-100'}"
                  aria-selected={sortBy==='start_date' && sortDir==='desc'}
                  role="tab">Terbaru dulu</button>
                <button
                  type="button"
                  on:click={() => setStartDateSort('asc')}
                  class="w-full px-3 py-1.5 text-sm font-semibold transition-colors border-l border-black/5 dark:border-white/10
                         {sortBy==='start_date' && sortDir==='asc' ? 'bg-violet-600 text-white' : 'bg-white/70 dark:bg-[#12101d]/70 text-slate-900 dark:text-slate-100'}"
                  aria-selected={sortBy==='start_date' && sortDir==='asc'}
                  role="tab">Terlama dulu</button>
              </div>
              <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Gunakan bagian <b>Sortir</b> di atas untuk kembali ke urutan <b>Create</b>.</p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <input type="date" value={dateFrom} on:change={(e)=>update('dateFrom',(e.target as HTMLInputElement).value)}
                     class="px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
              <input type="date" value={dateTo} on:change={(e)=>update('dateTo',(e.target as HTMLInputElement).value)}
                     class="px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
            </div>
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
