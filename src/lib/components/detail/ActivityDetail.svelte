<script lang="ts">
  export let activity: any = null;
  // Helper function for badge colors
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Completed': return 'text-green-800';
      case 'In Progress': return 'text-blue-800';
      case 'Pending': return 'text-yellow-800';
      case 'Cancelled': return 'text-red-800';
      default: return 'text-gray-800';
    }
  }
</script>

{#if activity}
  <div class="bg-white shadow border border-gray-200 overflow-hidden">
    <dl class="divide-y divide-gray-100">
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Nama Aktivitas</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {activity.name}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Project</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if activity.project}
            <a href={`/projects/${activity.project.id}`} class="text-indigo-600 hover:text-indigo-900">
              {activity.project.name}
            </a>
          {:else}
            <span class="text-gray-500">Project tidak ditemukan</span>
          {/if}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Jenis</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {activity.jenis}
        </dd>
      </div>
      {#if (activity.jenis === 'Customer' || activity.jenis === 'Vendor') && activity.mitra}
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">{activity.jenis}</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            <a href={`/mitras/${activity.mitra.id}`} class="text-indigo-600 hover:text-indigo-900">{activity.mitra.nama}</a>
          </dd>
        </div>
      {/if}
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Kategori</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-300 text-gray-900">
            {activity.kategori}
          </span>
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">From</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {activity.from || '-'}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">To</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {activity.to || '-'}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Deskripsi</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {activity.description}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Tanggal Aktivitas</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </dd>
      </div>
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500">Lampiran</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          {#if activity.attachment}
            <a href={`/storage/${activity.attachment}`} target="_blank" class="text-indigo-600 hover:text-indigo-900">Lihat</a>
          {:else}
            <span class="text-gray-500">Tidak ada file</span>
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if} 