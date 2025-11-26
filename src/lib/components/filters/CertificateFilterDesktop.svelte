<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FilterSection from './FilterSection.svelte';

  export let statusOptions: string[] = [];
  export let statusValue: string = '';
  export let dateFrom = '';
  export let dateTo = '';

  export let sortBy: 'created'|'date_of_issue'|'date_of_expired' = 'created';
  export let sortDir: 'desc'|'asc' = 'desc';
  export let dateSortField: 'date_of_issue'|'date_of_expired' = 'date_of_issue';

  const dispatch = createEventDispatcher<{
    update: {
      key: 'status'|'dateFrom'|'dateTo'|'sortBy'|'sortDir'|'dateSortField',
      value: any
    },
    clear: void
  }>();

  function update(
    key: 'status'|'dateFrom'|'dateTo'|'sortBy'|'sortDir'|'dateSortField',
    value: any
  ) {
    dispatch('update', { key, value });
  }
</script>

<div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-4 space-y-4">

  <!-- Status -->
  <FilterSection title="Status" showClear={!!statusValue} on:clear={() => update('status','')}>
    <div class="flex flex-wrap gap-2">
      {#each statusOptions as s}
        <button
          type="button"
          on:click={() => update('status', statusValue === s ? '' : s)}
          class="px-3 py-1.5 rounded-full text-xs border border-black/5 dark:border-white/10
                 hover:bg-black/5 dark:hover:bg-white/5
                 {statusValue===s ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}">
          {s}
        </button>
      {/each}
    </div>
  </FilterSection>

  <FilterSection title="Sortir" showClear={!!(dateFrom || dateTo)} on:clear={() => { update('dateFrom',''); update('dateTo',''); }}>
    <div class="space-y-3">
      <div>
        <span class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Urutkan Berdasarkan Create</span>
        <select
          bind:value={sortDir}
          on:change={() => { update('sortBy','created'); update('sortDir', sortDir); }}
          class="w-full mb-2 px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 text-slate-800 dark:text-slate-100"
          aria-label="Sortir Create"
        >
          <option value="desc">Create: Terbaru</option>
          <option value="asc">Create: Terlama</option>
        </select>
        <span class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Urutkan Tanggal</span>
        <select
          bind:value={dateSortField}
          on:change={() => update('dateSortField', dateSortField)}
          class="w-full mb-2 px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 text-slate-800 dark:text-slate-100"
          aria-label="Pilih tanggal yang diurutkan"
        >
          <option value="date_of_issue">Tanggal Terbit</option>
          <option value="date_of_expired">Tanggal Expired</option>
        </select>

        <div class="inline-flex w-full rounded-xl overflow-hidden border border-black/5 dark:border-white/10" role="tablist" aria-label="Urutan tanggal">
          <button
            type="button"
            on:click={() => { update('sortBy', dateSortField); update('sortDir','desc'); }}
            class="w-full px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                   {sortBy===dateSortField && sortDir==='desc' ? 'bg-indigo-600 text-white' : 'bg-white/70 dark:bg-[#12101d]/70 text-slate-900 dark:text-slate-100'}">
            Terbaru dulu
          </button>
          <button
            type="button"
            on:click={() => { update('sortBy', dateSortField); update('sortDir','asc'); }}
            class="w-full px-3 py-1.5 text-sm font-semibold transition-colors border-l border-black/5 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                   {sortBy===dateSortField && sortDir==='asc' ? 'bg-indigo-600 text-white' : 'bg-white/70 dark:bg-[#12101d]/70 text-slate-900 dark:text-slate-100'}">
            Terlama dulu
          </button>
        </div>

        <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Gunakan menu <b>Sortir</b> di atas untuk kembali ke urutan <b>Create</b>.
        </p>
      </div>

      <div>
        <div class="block text-xs text-slate-600 dark:text-slate-300">Dari</div>
        <input
          type="date"
          value={dateFrom}
          on:change={(e)=>update('dateFrom',(e.target as HTMLInputElement).value)}
          class="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
      </div>
      <div>
        <div class="block text-xs text-slate-600 dark:text-slate-300">Sampai</div>
        <input
          type="date"
          value={dateTo}
          on:change={(e)=>update('dateTo',(e.target as HTMLInputElement).value)}
          class="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
      </div>
    </div>
  </FilterSection>

  <div class="pt-1">
    <button
      class="w-full px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5"
      on:click={() => dispatch('clear')}
    >Clear all</button>
  </div>
</div>
