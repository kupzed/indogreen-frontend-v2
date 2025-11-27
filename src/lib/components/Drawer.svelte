<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { slide, fade } from 'svelte/transition';

  export let show: boolean = false;
  export let title: string = '';
  export let width: string = 'max-w-md';

  const dispatch = createEventDispatcher<{ close: void }>();

  function closeDrawer() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) closeDrawer();
  }

  function handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && show) closeDrawer();
  }

  $: if (show) document.addEventListener('keydown', handleEscapeKey);
  $: if (!show) document.removeEventListener('keydown', handleEscapeKey);
  onDestroy(() => document.removeEventListener('keydown', handleEscapeKey));
</script>

{#if show}
  <div class="fixed inset-0 overflow-hidden z-50" role="dialog" aria-modal="true" aria-label={title}>
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute inset-0 bg-black/40"
      on:click={handleBackdropClick}
      transition:fade={{ duration: 200 }}
    ></div>

    <div
      class="absolute inset-y-0 right-0 pl-10 max-w-full flex"
      transition:slide={{ axis: 'x', duration: 220 }}
    >
      <div class={`w-screen ${width} transform transition-transform duration-300 ease-out translate-x-0`}>
        <div class="h-full flex flex-col bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur border-l border-black/5 dark:border-white/10 shadow-xl">
          <div class="sticky top-0 z-10 px-4 py-3 sm:px-6 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
              <button
                type="button"
                on:click={closeDrawer}
                class="h-9 w-9 grid place-items-center rounded-md border border-black/5 dark:border-white/10
                       text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50
                       bg-white/70 dark:bg-[#12101d]/70 hover:bg-black/5 dark:hover:bg-white/5
                       focus:outline-none focus:ring-2 focus:ring-violet-500"
                aria-label="Close panel"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 text-slate-900 dark:text-slate-100 no-scrollbar">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
