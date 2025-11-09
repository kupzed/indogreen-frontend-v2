<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ close: void }>();

  export let show: boolean = false;
  export let title: string = '';
  export let maxWidth: string = 'max-w-xl';

  function closeModal() {
    show = false;
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && show) closeModal();
  }

  $: if (show) document.addEventListener('keydown', handleKeydown);
  $: if (!show) document.removeEventListener('keydown', handleKeydown);
  onDestroy(() => document.removeEventListener('keydown', handleKeydown));
</script>

{#if show}
  <div class="fixed inset-0 z-50 p-4 sm:p-8 grid place-items-center" role="dialog" aria-modal="true" aria-label={title}>
    <!-- Backdrop -->
    <button
      type="button"
      class="absolute inset-0 bg-black/40"
      on:click={closeModal}
      aria-label="Tutup modal"
      transition:fade={{ duration: 200 }}
    ></button>

    <!-- Panel -->
    <div
      transition:fade={{ duration: 200 }}
      class="relative w-full {maxWidth} rounded-2xl border border-black/5 dark:border-white/10
             bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur shadow-xl text-slate-900 dark:text-slate-100
             max-h-[90vh] overflow-y-auto no-scrollbar"
    >
      <!-- Header sticky + tombol close -->
      <div class="sticky top-0 z-20 px-5 py-3 border-b border-black/5 dark:border-white/10
                  bg-white/70 dark:bg-[#12101d]/70 backdrop-blur rounded-t-2xl
                  flex items-center justify-between">
        {#if title}<h2 class="text-base font-semibold">{title}</h2>{/if}
        <button
          type="button"
          class="h-9 w-9 grid place-items-center rounded-md
                 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70
                 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50
                 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500"
          on:click={closeModal}
          aria-label="Close modal"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="px-5 py-4">
        <slot></slot>
      </div>
    </div>
  </div>
{/if}

