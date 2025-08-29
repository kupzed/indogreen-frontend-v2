<script lang="ts">
  export let barangCertificates: any = null;
</script>

{#if barangCertificates}
  <div class="bg-white shadow border border-gray-200 overflow-hidden">
    <dl class="divide-y divide-gray-100">
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Nama</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {barangCertificates.name}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">No. Seri</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {barangCertificates.no_seri}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Mitra</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if barangCertificates.mitra}
          <a href={`/mitras/${barangCertificates.mitra.id}`} class="text-indigo-600 hover:text-indigo-900">{barangCertificates.mitra.nama}</a>
          {:else}
          -
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}