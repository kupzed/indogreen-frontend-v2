<script lang="ts">
  export let barangCertificates: any = null;
</script>

{#if barangCertificates}
  <div class="bg-white dark:bg-black shadow border border-gray-200 dark:border-neutral-800 overflow-hidden sm:rounded-md">
    <dl class="divide-y divide-gray-100 dark:divide-gray-800">
      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Nama</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {barangCertificates.name}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">No. Seri</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {barangCertificates.no_seri}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Mitra</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {#if barangCertificates.mitra}
            <a href={`/mitras/${barangCertificates.mitra.id}`} class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">{barangCertificates.mitra.nama}</a>
          {:else}
            -
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
