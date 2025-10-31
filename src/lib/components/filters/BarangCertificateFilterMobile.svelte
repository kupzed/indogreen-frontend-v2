<script lang="ts" context="module">
  // DIEKSPOR supaya props komponen dapat type yang valid di consumer
  export type MitraOption = { id: number; nama: string };
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import FilterSection from './FilterSection.svelte';

  export let open = false;
  export let mitras: MitraOption[] = [];
  export let mitraValue: number | '' = '';

  const dispatch = createEventDispatcher<{
    update: { key: 'mitra', value: number | '' },
    clear: void,
    apply: void,
    close: void
  }>();

  function updateMitra(val: string) {
    const parsed = val === '' ? '' : Number(val);
    dispatch('update', { key: 'mitra', value: (val === '' || Number.isNaN(parsed)) ? '' : parsed });
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
        <FilterSection title="Mitra" startOpen={true} showClear={mitraValue !== ''} on:clear={() => dispatch('update', { key:'mitra', value:'' })}>
          <div class="mt-2">
            <select
              class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70"
              on:change={(e) => updateMitra((e.target as HTMLSelectElement).value)}
              value={mitraValue === '' ? '' : String(mitraValue)}
            >
              <option value="">Semua</option>
              {#each mitras as m}
                <option value={m.id}>{m.nama}</option>
              {/each}
            </select>
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
