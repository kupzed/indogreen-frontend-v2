<script lang="ts">
  export let certificates: any = null;
</script>

{#if certificates}
  <div class="bg-white shadow border border-gray-200 overflow-hidden">
    <dl class="divide-y divide-gray-100">
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Nama</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {certificates.name}
            </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">No. Sertifikat</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {certificates.no_certificate}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Barang</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {#if certificates.barang_certificate}
              <a href={`/barang-certificates/${certificates.barang_certificate.id}`} class="text-indigo-600 hover:text-indigo-900">
                {certificates.barang_certificate.name}
              </a>
            {:else}
              -
            {/if}
          </dd>
        </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Project</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if certificates.project}
            <a href={`/projects/${certificates.project.id}`} class="text-indigo-600 hover:text-indigo-900">
              {certificates.project.name}
            </a>
          {:else}
            -
          {/if}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Status</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {certificates.status}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Tanggal Terbit</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if certificates.date_of_issue}
            {new Date(certificates.date_of_issue).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          {:else}
            <span class="text-gray-500">-</span>
          {/if}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Tanggal Expired</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if certificates.date_of_expired}
            {new Date(certificates.date_of_expired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          {:else}
            <span class="text-gray-500">-</span>
          {/if}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Lampiran</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if certificates.attachment}
            <a href={`/storage/${certificates.attachment}`} target="_blank" class="text-indigo-600 hover:text-indigo-900">Lihat</a>
          {:else}
            <span class="text-gray-500">Tidak ada file</span>
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}