<script lang="ts">
  export let mitra: any = null;

  function getKategoriBadgeColor(kategori: string) {
    switch (kategori) {
      case 'Pribadi': return 'bg-indigo-600';
      case 'Perusahaan': return 'bg-indigo-600';
      case 'Customer': return 'bg-indigo-600';
      case 'Vendor': return 'bg-indigo-600';
      default: return 'bg-gray-600';
    }
  }
</script>

{#if mitra}
  <div class="bg-white shadow border border-gray-200 overflow-hidden">
    <dl class="divide-y divide-gray-100">
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Nama</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {mitra.nama}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Kategori</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if mitra.is_pribadi}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Pribadi')} text-white mr-1">Pribadi</span>{/if}
          {#if mitra.is_perusahaan}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Perusahaan')} text-white mr-1">Perusahaan</span>{/if}
          {#if mitra.is_customer}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Customer')} text-white mr-1">Customer</span>{/if}
          {#if mitra.is_vendor}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Vendor')} text-white mr-1">Vendor</span>{/if}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Alamat</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {mitra.alamat}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Website</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {mitra.website || '-'}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Email</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {mitra.email || '-'}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Kontak 1</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if mitra.kontak_1}
            {mitra.kontak_1}<br>
            <span class="text-xs text-gray-500">Nama: {mitra.kontak_1_nama} | Jabatan: {mitra.kontak_1_jabatan}</span>
          {:else}
            -
          {/if}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Kontak 2</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if mitra.kontak_2}
            {mitra.kontak_2}<br>
            <span class="text-xs text-gray-500">Nama: {mitra.kontak_2_nama} | Jabatan: {mitra.kontak_2_jabatan}</span>
          {:else}
            -
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if} 