<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let open = false;

  export let kategoriOptions: string[] = [];
  export let kategoriValue = '';
  export let dateFrom = '';
  export let dateTo = '';

  const dispatch = createEventDispatcher<{
    update: { key: 'kategori'|'dateFrom'|'dateTo', value: any };
    clear: void;
    apply: void;
    close: void;
  }>();

  function cap(s: string){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
</script>

{#if open}
  <div class="fixed inset-0 z-50" role="dialog" aria-modal="true">
    <!-- backdrop -->
    <button class="absolute inset-0 bg-black/50" aria-label="Tutup" on:click={() => dispatch('close')}></button>

    <!-- panel -->
    <div class="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur p-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">Filters</h3>
        <button class="h-9 w-9 grid place-items-center rounded-xl border border-black/5 dark:border-white/10" on:click={() => dispatch('close')} aria-label="Tutup">✕</button>
      </div>

      <div class="space-y-4 max-h-[65vh] overflow-y-auto">
        <!-- Kategori -->
        <div>
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold">Kategori</h4>
            {#if kategoriValue}<button class="text-xs text-slate-500 hover:underline" on:click={() => dispatch('update', {key:'kategori', value:''})}>Clear</button>{/if}
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            {#each kategoriOptions as k}
              <button type="button"
                on:click={() => dispatch('update', { key:'kategori', value:(kategoriValue===k?'':k) })}
                class="px-3 py-1.5 rounded-full text-xs border border-black/5 dark:border-white/10
                       hover:bg-black/5 dark:hover:bg-white/5
                       {kategoriValue===k ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}">
                {cap(k)}
              </button>
            {/each}
          </div>
        </div>

        <!-- Date -->
        <div>
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold">Tanggal</h4>
            {#if dateFrom || dateTo}
              <button class="text-xs text-slate-500 hover:underline" on:click={() => { dispatch('update', {key:'dateFrom', value:''}); dispatch('update', {key:'dateTo', value:''}); }}>Clear</button>
            {/if}
          </div>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <input type="date" bind:value={dateFrom} class="px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
            <input type="date" bind:value={dateTo}   class="px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
          </div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <button class="px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5" on:click={() => dispatch('clear')}>Clear all</button>
        <button class="px-3 py-2 text-sm font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700"
                on:click={() => dispatch('apply')}>
          Done
        </button>
      </div>
    </div>
  </div>
{/if}
