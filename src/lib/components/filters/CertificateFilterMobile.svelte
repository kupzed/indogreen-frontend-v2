<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import FilterSection from './FilterSection.svelte';

  export let open = false;

  export let statusOptions: string[] = [];
  export let statusValue: string = '';
  export let dateFrom = '';
  export let dateTo = '';

  const dispatch = createEventDispatcher<{
    update: { key: 'status'|'dateFrom'|'dateTo', value: any },
    clear: void,
    apply: void,
    close: void
  }>();

  function update(key: 'status'|'dateFrom'|'dateTo', value: any) {
    dispatch('update', { key, value });
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50" role="dialog" aria-modal="true">
    <button transition:fade={{ duration: 250 }} class="absolute inset-0 bg-black/50" on:click={() => dispatch('close')} aria-label="Tutup"></button>

    <div
      in:fly={{ y: 300, duration: 300, opacity: 0 }}
      out:fly={{ y: 300, duration: 250, opacity: 0 }}
      class="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur p-4 max-h-[85vh] overflow-y-auto overscroll-contain"
    >
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">Filters</h3>
        <button class="h-9 w-9 grid place-items-center rounded-xl border border-black/5 dark:border-white/10" on:click={() => dispatch('close')} aria-label="Tutup">✕</button>
      </div>

      <div class="space-y-4 max-h-[65vh] overflow-y-auto [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]">
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

        <FilterSection title="Tanggal Terbit" showClear={!!(dateFrom || dateTo)} on:clear={() => { update('dateFrom',''); update('dateTo',''); }}>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <input type="date" value={dateFrom} on:change={(e)=>update('dateFrom',(e.target as HTMLInputElement).value)}
                   class="px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
            <input type="date" value={dateTo} on:change={(e)=>update('dateTo',(e.target as HTMLInputElement).value)}
                   class="px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
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
