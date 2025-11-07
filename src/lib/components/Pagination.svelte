<script lang="ts">
  export let currentPage: number;
  export let lastPage: number;
  export let totalItems: number;
  export let itemsPerPage: number = 10;

  // opsi & handler perubahan per page (tetap kompatibel)
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
    if (!Number.isNaN(n) && n !== itemsPerPage) onPerPageChange(n);
  }

  // util class untuk pill button
  const pill =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm border transition " +
    "border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 " +
    "hover:bg-violet-600/10 hover:text-violet-700 dark:hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50";
  const pillIcon =
    "inline-flex items-center justify-center rounded-md p-1.5 border " +
    "border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 " +
    "hover:bg-violet-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50";
</script>

{#if totalItems > 0}
  <div class="border-y border-y-black/5 dark:border-y-white/10 px-4 py-3 sm:px-5 shadow-sm">
    <!-- Mobile -->
    {#if showMobileButtons}
      <div class="sm:hidden flex flex-col gap-3 items-stretch text-center">
        {#if showResultsInfo}
          <div class="text-sm text-slate-700 dark:text-slate-300">
            Showing
            <select
              value={itemsPerPage}
              on:change={handlePerPageChange}
              class="w-auto mx-1 py-1 rounded-md border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f0d1b] text-xs
                    text-slate-900 dark:text-slate-100"
            >
              {#each perPageOptions as opt}<option value={opt}>{opt}</option>{/each}
            </select>
            Records (<b>{startItem}</b> – <b>{endItem}</b> of <b>{totalItems}</b>)
          </div>
        {/if}

        <nav class="flex items-center justify-center gap-2" aria-label="Pagination">
          <button class={pill} on:click={() => goToPage(1)} disabled={currentPage === 1}
            class:opacity-50={currentPage === 1} class:cursor-not-allowed={currentPage === 1}>First</button>

          <button class={pillIcon} on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
            class:opacity-50={currentPage === 1} class:cursor-not-allowed={currentPage === 1} aria-label="Previous page">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/></svg>
          </button>

          <span class="inline-flex items-center rounded-md px-3 py-1.5 text-xs border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300">
            Page {currentPage} of {lastPage}
          </span>

          <button class={pillIcon} on:click={() => goToPage(currentPage + 1)} disabled={currentPage === lastPage}
            class:opacity-50={currentPage === lastPage} class:cursor-not-allowed={currentPage === lastPage} aria-label="Next page">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
          </button>

          <button class={pill} on:click={() => goToPage(lastPage)} disabled={currentPage === lastPage}
            class:opacity-50={currentPage === lastPage} class:cursor-not-allowed={currentPage === lastPage}>Last</button>
        </nav>
      </div>
    {/if}

    <!-- Desktop -->
    <div class="hidden sm:flex sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        {#if showResultsInfo}
          <div class="text-sm text-slate-700 dark:text-slate-300">
            Showing
            <select
              value={itemsPerPage}
              on:change={handlePerPageChange}
              class="w-auto mx-1 py-1 rounded-md border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f0d1b] text-xs
                    text-slate-900 dark:text-slate-100"
            >
              {#each perPageOptions as opt}<option value={opt}>{opt}</option>{/each}
            </select>
            Records (<b>{startItem}</b> – <b>{endItem}</b> of <b>{totalItems}</b>)
          </div>
        {/if}
      </div>

      <nav class="flex items-center gap-2" aria-label="Pagination">
        <button class={pill} on:click={() => goToPage(1)} disabled={currentPage === 1}
          class:opacity-50={currentPage === 1} class:cursor-not-allowed={currentPage === 1}>First</button>

        <button class={pillIcon} on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
          class:opacity-50={currentPage === 1} class:cursor-not-allowed={currentPage === 1} aria-label="Previous page">
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/></svg>
        </button>

        <span class="inline-flex items-center rounded-md px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300">
          Page {currentPage} of {lastPage}
        </span>

        <button class={pillIcon} on:click={() => goToPage(currentPage + 1)} disabled={currentPage === lastPage}
          class:opacity-50={currentPage === lastPage} class:cursor-not-allowed={currentPage === lastPage} aria-label="Next page">
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
        </button>

        <button class={pill} on:click={() => goToPage(lastPage)} disabled={currentPage === lastPage}
          class:opacity-50={currentPage === lastPage} class:cursor-not-allowed={currentPage === lastPage}>Last</button>
      </nav>
    </div>
  </div>
{/if}
