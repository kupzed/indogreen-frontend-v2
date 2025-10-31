<script lang="ts" context="module">
  // Tidak ada option kompleks di sini, jadi cukup string props
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FilterSection from './FilterSection.svelte';

  export let statusOptions: string[] = [];
  export let statusValue: string = '';
  export let dateFrom = '';
  export let dateTo = '';

  const dispatch = createEventDispatcher<{
    update: { key: 'status'|'dateFrom'|'dateTo', value: any },
    clear: void
  }>();

  function update(key: 'status'|'dateFrom'|'dateTo', value: any) {
    dispatch('update', { key, value });
  }
</script>

<div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-4 space-y-4">
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

  <!-- Tanggal -->
  <FilterSection title="Tanggal Terbit" showClear={!!(dateFrom || dateTo)} on:clear={() => { update('dateFrom',''); update('dateTo',''); }}>
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
