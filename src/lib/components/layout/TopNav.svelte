<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition'; // Untuk transisi dropdown
  import { page } from '$app/stores';

  const dispatch = createEventDispatcher();

  let showUserDropdown = false;

  function toggleMobileSidebar() {
    dispatch('toggleMobileSidebar');
  }

  // Handle click outside for dropdown
  function handleClickOutside(event: MouseEvent) {
    if (showUserDropdown && event.target && !(event.target as HTMLElement).closest('#user-menu-button, #user-dropdown-menu')) {
      showUserDropdown = false;
    }
  }

  $: // Efek samping untuk menambahkan/menghapus event listener
  if (showUserDropdown) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
</script>

<header class="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button
    type="button"
    class="ml-4 text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-2 lg:hidden"
    on:click={toggleMobileSidebar}
  >
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <div class="flex flex-1 justify-between px-4 py-4">
    <div class="flex flex-1 items-center">
      <slot name="topnav-title"></slot>
    </div>

    <div class="ml-4 flex items-center md:ml-6">
      <div class="relative" id="user-dropdown-container">
        <div>
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button
            type="button"
            class="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-2"
            id="user-menu-button"
            aria-expanded={showUserDropdown}
            on:click={() => (showUserDropdown = !showUserDropdown)}
          >
            <svg class="size-10 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd" />
            </svg>
            <svg class="ml-1 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {#if showUserDropdown}
          <div
            id="user-dropdown-menu"
            class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
            tabindex="-1"
            transition:fade="{{ duration: 100 }}"
          >
            <button
              type="button"
              on:click={() => dispatch('logout')}
              class="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-700 hover:text-white"
              role="menuitem"
              tabindex="-1"
            >
              Logout
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>