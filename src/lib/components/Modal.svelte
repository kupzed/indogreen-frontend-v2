<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let show: boolean = false;
  export let title: string = '';
  export let maxWidth: string = 'max-w-lg';

  function closeModal() {
    show = false;
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') closeModal();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="fixed inset-0 flex items-center justify-center bg-black/25 dark:bg-neutral-800/40 z-50 p-8">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0" on:click={closeModal}></div>

    <div
      class="bg-white dark:bg-black border border-transparent dark:border-gray-800 rounded-lg shadow-lg w-full {maxWidth} p-6 relative overflow-y-auto max-h-[90vh] text-gray-900 dark:text-gray-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        id="close-modal-btn"
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 text-2xl
               focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        on:click={closeModal}
        aria-label="Close modal"
      >
        &times;
      </button>
      <h2 id="modal-title" class="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
        {title}
      </h2>
      <slot></slot>
    </div>
  </div>
{/if}

<style>
  /* tetap kosong; util Tailwind dipakai */
</style>
