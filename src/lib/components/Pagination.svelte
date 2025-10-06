<script lang="ts">
  export let currentPage: number;
  export let lastPage: number;
  export let totalItems: number;
  export let itemsPerPage: number = 10;

  // NEW: opsi & handler perubahan per page
  export let perPageOptions: number[] = [10, 25, 50, 100];
  export let onPerPageChange: (n: number) => void = () => {};

  export let onPageChange: (page: number) => void;
  export let showResultsInfo: boolean = true;
  export let showMobileButtons: boolean = true;

  $: startItem = (currentPage - 1) * itemsPerPage + 1;
  $: endItem = Math.min(currentPage * itemsPerPage, totalItems);

  function goToPage(page: number) {
    if (page >= 1 && page <= lastPage && page !== currentPage) onPageChange(page);
  }

  function handlePerPageChange(e: Event) {
    const n = parseInt((e.target as HTMLSelectElement).value, 10);
    if (!Number.isNaN(n) && n !== itemsPerPage) {
      onPerPageChange(n);
    }
  }
</script>

{#if totalItems > 0}
  <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-4 py-3 sm:px-6">
    {#if showMobileButtons}
      <!-- Mobile -->
      <div class="sm:hidden w-full flex flex-col items-center justify-center gap-2 text-center">
        {#if showResultsInfo}
          <p class="text-xs text-gray-700 dark:text-gray-300">
            Showing
            <select
              value={itemsPerPage}
              on:change={handlePerPageChange}
              class="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white text-gray-900
                     dark:bg-neutral-900 dark:text-gray-100 dark:border-gray-700"
            >
              {#each perPageOptions as opt}
                <option value={opt}>{opt}</option>
              {/each}
            </select>
            Records (Showing <span class="font-bold">{startItem}</span> to <span class="font-bold">{endItem}</span> of <span class="font-bold">{totalItems}</span>)
          </p>
        {/if}

        <nav class="flex items-center justify-center space-x-1" aria-label="Pagination">
          <!-- First -->
          <button
            on:click={() => goToPage(1)}
            disabled={currentPage === 1}
            class="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700 dark:hover:bg-neutral-800
                  {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            First
          </button>

          <!-- Prev -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            class="p-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700 dark:hover:bg-neutral-800
                  {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- Page info -->
          <span class="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md
                      dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700">
            Page {currentPage} of {lastPage}
          </span>

          <!-- Next -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage === lastPage}
            class="p-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700 dark:hover:bg-neutral-800
                  {currentPage === lastPage ? 'opacity-50 cursor-not-allowed' : ''}">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- Last -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button
            on:click={() => goToPage(lastPage)}
            disabled={currentPage === lastPage}
            class="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700 dark:hover:bg-neutral-800
                  {currentPage === lastPage ? 'opacity-50 cursor-not-allowed' : ''}">
            Last
          </button>
        </nav>
      </div>
    {/if}

    <!-- Desktop -->
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        {#if showResultsInfo}
          <p class="text-xs text-gray-700 dark:text-gray-300">
            Showing
            <select
              value={itemsPerPage}
              on:change={handlePerPageChange}
              class="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white text-gray-900
                    dark:bg-neutral-900 dark:text-gray-100 dark:border-gray-700"
            >
              {#each perPageOptions as opt}
                <option value={opt}>{opt}</option>
              {/each}
            </select>
            Records (Showing <span class="font-bold">{startItem}</span> to <span class="font-bold">{endItem}</span> of <span class="font-bold">{totalItems}</span>)
          </p>
        {/if}
      </div>

      <div>
        <nav class="flex items-center space-x-2" aria-label="Pagination">
          <button 
            on:click={() => goToPage(1)} 
            disabled={currentPage === 1} 
            class="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700 dark:hover:bg-neutral-800
                   {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            First
          </button>

          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button 
            on:click={() => goToPage(currentPage - 1)} 
            disabled={currentPage === 1} 
            class="p-1.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700 dark:hover:bg-neutral-800
                   {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
            </svg>
          </button>

          <span class="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md
                       dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700">
            Page {currentPage} of {lastPage}
          </span>

          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button 
            on:click={() => goToPage(currentPage + 1)} 
            disabled={currentPage === lastPage} 
            class="p-1.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700 dark:hover:bg-neutral-800
                   {currentPage === lastPage ? 'opacity-50 cursor-not-allowed' : ''}">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>

          <button 
            on:click={() => goToPage(lastPage)} 
            disabled={currentPage === lastPage} 
            class="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   dark:text-gray-100 dark:bg-neutral-900 dark:border-gray-700 dark:hover:bg-neutral-800
                   {currentPage === lastPage ? 'opacity-50 cursor-not-allowed' : ''}">
            Last
          </button>
        </nav>
      </div>
    </div>
  </div>
{/if}
