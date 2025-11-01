<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import FilterSection from './FilterSection.svelte';

  type VendorOption = { id: number | string; nama: string };

  export let open = false;

  export let jenisOptions: string[] = [];
  export let kategoriOptions: string[] = [];
  export let jenisValue = '';
  export let kategoriValue = '';
  export let dateFrom = '';
  export let dateTo = '';

  // ==== vendor support ====
  export let vendorOptions: VendorOption[] = [];
  export let vendorValue: number | string | '' = '';

  const dispatch = createEventDispatcher<{
    update: { key: 'jenis'|'kategori'|'dateFrom'|'dateTo'|'vendor', value: any },
    clear: void,
    apply: void,
    close: void
  }>();

  function update(key: 'jenis'|'kategori'|'dateFrom'|'dateTo'|'vendor', value: any) {
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
        <FilterSection title="Jenis" showClear={!!jenisValue} startOpen on:clear={() => update('jenis','')}>
          <div class="mt-2 flex flex-wrap gap-2">
            {#each jenisOptions as j}
              <button type="button"
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
            <div class="mt-2">
              <select
                value={vendorValue}
                on:change={(e)=>update('vendor', (e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70"
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

        <FilterSection title="Tanggal" showClear={!!(dateFrom || dateTo)} on:clear={() => { update('dateFrom',''); update('dateTo',''); }}>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <input type="date" value={dateFrom} on:change={(e)=>update('dateFrom',(e.target as HTMLInputElement).value)}
                   class="px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
            <input type="date" value={dateTo} on:change={(e)=>update('dateTo',(e.target as HTMLInputElement).value)}
                   class="px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
          </div>
        </FilterSection>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <button class="px-3 py-2 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5" on:click={() => dispatch('clear')}>Clear all</button>
        <button class="px-3 py-2 text-sm font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700" on:click={() => dispatch('apply')}>Done</button>
      </div>
    </div>
  </div>
{/if}
