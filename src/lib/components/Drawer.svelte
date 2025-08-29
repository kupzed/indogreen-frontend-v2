<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  
  export let show: boolean = false;
  export let title: string = '';
  export let width: string = 'max-w-md';
  
  const dispatch = createEventDispatcher();
  
  function closeDrawer() {
    dispatch('close');
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDrawer();
    }
  }
  
  function handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && show) {
      closeDrawer();
    }
  }
  
  // Add escape key listener when drawer is open
  $: if (show) {
    document.addEventListener('keydown', handleEscapeKey);
  } else {
    document.removeEventListener('keydown', handleEscapeKey);
  }
</script>

{#if show}
  <div class="fixed inset-0 overflow-hidden z-50">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="absolute inset-0" 
      on:click={handleBackdropClick}
      transition:fade="{{ duration: 300 }}"
    ></div>
    
    <div 
      class="absolute inset-y-0 right-0 pl-10 max-w-full flex"
      transition:slide="{{ axis: 'x', duration: 300 }}"
    >
      <div class="w-screen {width} transform transition-transform duration-500 ease-in-out translate-x-0">
        <div class="h-full flex flex-col bg-white shadow-xl">
          <div class="px-4 py-6 sm:px-6">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-gray-900">{title}</h2>
              <button 
                type="button" 
                on:click={closeDrawer}
                class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span class="sr-only">Close panel</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto px-4 sm:px-6">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}