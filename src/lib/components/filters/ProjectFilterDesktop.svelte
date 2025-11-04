<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FilterSection from './FilterSection.svelte';

  export let statusOptions: string[] = [];
  export let kategoriOptions: string[] = [];
  export let statusValue = '';
  export let kategoriValue = '';
  export let certValue = false;
  export let dateFrom = '';
  export let dateTo = '';

  const dispatch = createEventDispatcher<{
    update: { key: 'status'|'kategori'|'cert'|'dateFrom'|'dateTo', value: any },
    clear: void
  }>();

  function update(key: 'status'|'kategori'|'cert'|'dateFrom'|'dateTo', value: any) {
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

  <!-- Kategori -->
  <FilterSection title="Kategori" showClear={!!kategoriValue} on:clear={() => update('kategori','')}>
    <div class="flex flex-wrap gap-2">
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

  <!-- Certificate -->
  <FilterSection title="Certificate" showClear={certValue} on:clear={() => update('cert', false)}>
    <div class="flex items-center justify-between pt-1">
      <span class="text-sm text-slate-700 dark:text-slate-200">Hanya project bersertifikat</span>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          class="sr-only peer"
          checked={certValue}
          on:change={(e) => update('cert', (e.target as HTMLInputElement).checked)}
        />
        <div class="relative w-11 h-6 rounded-full transition-colors duration-200
                    bg-gray-200 dark:bg-neutral-700 peer-checked:bg-indigo-600
                    after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                    after:h-5 after:w-5 after:rounded-full
                    after:bg-white dark:after:bg-neutral-200
                    after:border after:border-gray-300 dark:after:border-gray-500
                    after:transition-transform after:duration-200
                    peer-checked:after:translate-x-5">
        </div>
      </label>
    </div>
  </FilterSection>

  <!-- Tanggal -->
  <FilterSection title="Tanggal" showClear={!!(dateFrom || dateTo)} on:clear={() => { update('dateFrom',''); update('dateTo',''); }}>
    <div class="space-y-2">
      <div class="block text-xs text-slate-600 dark:text-slate-300">Dari</div>
      <input type="date" value={dateFrom} on:change={(e)=>update('dateFrom',(e.target as HTMLInputElement).value)}
             class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
      <div class="block text-xs text-slate-600 dark:text-slate-300 mt-2">Sampai</div>
      <input type="date" value={dateTo} on:change={(e)=>update('dateTo',(e.target as HTMLInputElement).value)}
             class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
    </div>
  </FilterSection>

  <div class="pt-1">
    <button
      class="w-full px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5"
      on:click={() => dispatch('clear')}
    >Clear all</button>
  </div>
</div>
