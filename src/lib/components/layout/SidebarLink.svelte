<script lang="ts">
    import { page } from '$app/stores';
    import { createEventDispatcher } from 'svelte'; // Import createEventDispatcher
  
    const dispatch = createEventDispatcher(); // Inisialisasi dispatcher
  
    export let href: string;
    export let icon: string; // SVG path data
    export let collapsed: boolean = false;
    export let routePrefix: string = ''; // Untuk mencocokkan rute aktif yang lebih kompleks
  
    $: isActive = $page.url.pathname === href || (routePrefix && $page.url.pathname.startsWith(`/${routePrefix}`));
  
    $: linkClasses = `
      group flex items-center px-2 py-2 text-base font-medium rounded-md
      ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
      ${collapsed ? 'justify-center' : ''}
      transition-colors duration-200
    `;
  
    $: iconClasses = `
      mx-2 flex-shrink-0 h-6 w-6
      ${isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-indigo-600'}
      ${collapsed ? 'mx-2' : ''}
      transition-transform duration-200
    `;
  
    // Fungsi untuk mengirimkan event ketika link diklik
    function handleClick() {
      dispatch('click'); // Kirim event 'click'
    }
  </script>
  
  <a {href} class={linkClasses} on:click={handleClick}> <svg class={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon} />
    </svg>
    {#if !collapsed}
      <span class="whitespace-nowrap">
        <slot></slot> </span>
    {/if}
  </a>