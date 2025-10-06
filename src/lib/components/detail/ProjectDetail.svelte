<script lang="ts">
  export let project: any = null;

  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Complete': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Ongoing':  return 'bg-blue-100  dark:bg-blue-900  text-blue-800  dark:text-blue-200';
      case 'Prospect': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'Cancel':   return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:         return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  }
</script>

{#if project}
  <div class="bg-white dark:bg-black shadow border border-gray-200 dark:border-neutral-800 overflow-hidden sm:rounded-md">
    <dl class="divide-y divide-gray-100 dark:divide-gray-800">
      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Nama Project</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{project.name}</dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Customer</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {#if project.mitra}
            <a href={`/mitras/${project.mitra.id}`} class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">{project.mitra.nama}</a>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Kategori</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{project.kategori || '-'}</dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Lokasi</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{project.lokasi || '-'}</dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Status</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusBadgeClasses(project.status)}">
            {project.status}
          </span>
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">No. PO</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{project.no_po || '-'}</dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">No. SO</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{project.no_so || '-'}</dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Deskripsi</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{project.description}</dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Tanggal Mulai</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Tanggal Selesai</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {#if project.finish_date}
            {new Date(project.finish_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          {:else}
            <span class="text-gray-500 dark:text-gray-400">Tanggal belum ditambahkan</span>
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
