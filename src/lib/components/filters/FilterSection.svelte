<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';

  export let title: string;
  export let startOpen = true;
  export let showClear = false;

  const dispatch = createEventDispatcher<{ clear: void }>();
  let open = startOpen;
</script>

<div class="border-b border-black/5 dark:border-white/10 pb-3">
  <div class="flex items-center justify-between">
    <button
      type="button"
      class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"
      aria-expanded={open}
      on:click={() => (open = !open)}
    >
      <svg class="w-4 h-4 transition-transform" class:rotate-90={open} viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.21 14.27a.75.75 0 0 1-1.06-1.06L9.35 10 6.15 6.79a.75.75 0 1 1 1.06-1.06l3.7 3.7a.75.75 0 0 1 0 1.06l-3.7 3.78Z" clip-rule="evenodd"/>
      </svg>
      {title}
    </button>

    {#if showClear}
      <button
        type="button"
        class="text-xs text-slate-500 hover:underline"
        on:click={() => dispatch('clear')}
      >Clear</button>
    {/if}
  </div>

  {#if open}
    <div class="mt-2" transition:slide>
      <slot />
    </div>
  {/if}
</div>
