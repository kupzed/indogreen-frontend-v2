<script lang="ts">
  import FilterSection from './FilterSection.svelte';
  import { createEventDispatcher } from 'svelte';

  type VendorOption = { id: number | string; nama: string };

  export let jenisOptions: string[] = [];
  export let kategoriOptions: string[] = [];
  export let jenisValue = '';
  export let kategoriValue = '';
  export let dateFrom = '';
  export let dateTo = '';

  // ==== vendor support ====
  export let vendorOptions: VendorOption[] = [];
  export let vendorValue: number | string | '' = '';

  // ==== sorting props ====
  export let sortBy: 'created'|'activity_date' = 'created';
  export let sortDir: 'desc'|'asc' = 'desc';

  const dispatch = createEventDispatcher<{
    update: { key: 'jenis'|'kategori'|'dateFrom'|'dateTo'|'vendor'|'sortBy'|'sortDir', value: any },
    clear: void
  }>();

  function update(key: 'jenis'|'kategori'|'dateFrom'|'dateTo'|'vendor'|'sortBy'|'sortDir', value: any) {
    dispatch('update', { key, value });
  }
</script>

<div class="border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-4 space-y-4">

  <FilterSection title="Sortir" startOpen>
    <div class="space-y-2">
      <span class="block text-xs text-slate-600 dark:text-slate-300">Urut Berdasarkan Create</span>
      <select
        bind:value={sortDir}
        on:change={() => { update('sortBy','created'); update('sortDir', sortDir); }}
        class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 text-slate-800 dark:text-slate-100"
        aria-label="Sortir Create"
      >
        <option value="desc">Create: Terbaru</option>
        <option value="asc">Create: Terlama</option>
      </select>
    </div>
  </FilterSection>

  <FilterSection title="Jenis" showClear={!!jenisValue} on:clear={() => update('jenis','')}>
    <div class="mt-1 flex flex-wrap gap-2">
      {#each jenisOptions as j}
        <button
          type="button"
          on:click={() => update('jenis', jenisValue === j ? '' : j)}
          class="px-3 py-1.5 rounded-full text-xs border border-black/5 dark:border-white/10
                 hover:bg-black/5 dark:hover:bg-white/5
                 {jenisValue===j ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}">
          {j}
        </button>
      {/each}
    </div>
  </FilterSection>

  {#if vendorOptions.length > 0 && jenisValue === 'Vendor'}
    <FilterSection title="Vendor" showClear={!!vendorValue} on:clear={() => update('vendor','')}>
      <div class="space-y-2">
        <span class="block text-xs text-slate-600 dark:text-slate-300">Pilih Vendor</span>
        <select
          bind:value={vendorValue}
          on:change={(e)=>update('vendor', (e.target as HTMLSelectElement).value)}
          class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 text-slate-800 dark:text-slate-100"
          aria-label="Filter Vendor"
        >
          <option value="">Semua Vendor</option>
          {#each vendorOptions as v}
            <option value={v.id}>{v.nama}</option>
          {/each}
        </select>
      </div>
    </FilterSection>
  {/if}

  <FilterSection title="Kategori" showClear={!!kategoriValue} on:clear={() => update('kategori','')}>
    <div class="mt-1 flex flex-wrap gap-2">
      {#each kategoriOptions as k}
        <button
          type="button"
          on:click={() => update('kategori', kategoriValue === k ? '' : k)}
          class="px-3 py-1.5 rounded-full text-xs border border-black/5 dark:border-white/10
                 hover:bg-black/5 dark:hover:bg-white/5
                 {kategoriValue===k ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}">
          {k}
        </button>
      {/each}
    </div>
  </FilterSection>

  <FilterSection title="Tanggal" showClear={!!(dateFrom || dateTo)} on:clear={() => { update('dateFrom',''); update('dateTo',''); }}>
    <div class="space-y-3">
      <div>
        <span class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Urutkan Tanggal Aktivitas</span>
        <div class="inline-flex w-full rounded-xl overflow-hidden border border-black/5 dark:border-white/10" role="tablist" aria-label="Urutan tanggal aktivitas">
          <button
            type="button"
            on:click={() => { update('sortBy','activity_date'); update('sortDir','desc'); }}
            class="w-full px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                   {sortBy==='activity_date' && sortDir==='desc' ? 'bg-indigo-600 text-white' : 'bg-white/70 dark:bg-[#12101d]/70 text-slate-900 dark:text-slate-100'}">
            Terbaru dulu
          </button>
          <button
            type="button"
            on:click={() => { update('sortBy','activity_date'); update('sortDir','asc'); }}
            class="w-full px-3 py-1.5 text-sm font-semibold transition-colors border-l border-black/5 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                   {sortBy==='activity_date' && sortDir==='asc' ? 'bg-indigo-600 text-white' : 'bg-white/70 dark:bg-[#12101d]/70 text-slate-900 dark:text-slate-100'}">
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

  <div class="pt-2">
    <button
      class="w-full px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5"
      on:click={() => dispatch('clear')}>
      Clear all
    </button>
  </div>
</div>
