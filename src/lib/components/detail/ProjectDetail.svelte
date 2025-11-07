<script lang="ts">
  export let project: any = null;

  function getStatusBadgeClasses(status: string) {
    switch ((status || '').toLowerCase()) {
      case 'complete': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      case 'ongoing':  return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'prospect': return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
      case 'cancel':   return 'bg-rose-500/20 text-rose-700 dark:text-rose-300';
      default:         return 'bg-slate-500/15 text-slate-700 dark:text-slate-300';
    }
  }
</script>

{#if project}
  <div class="bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm border border-black/5 dark:border-white/10 overflow-hidden">
    <dl class="divide-y divide-black/5 dark:divide-white/10">
      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Nama Project</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{project.name}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Customer</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if project.mitra}
            <a href={`/mitras/${project.mitra.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{project.mitra.nama}</a>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Kategori</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{project.kategori || '-'}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Lokasi</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{project.lokasi || '-'}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Status</dt>
        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
          <span class={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusBadgeClasses(project.status)}`}>
            {project.status}
          </span>
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">No. PO</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{project.no_po || '-'}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">No. SO</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{project.no_so || '-'}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Deskripsi</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{project.description}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Tanggal Mulai</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Tanggal Selesai</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if project.finish_date}
            {new Date(project.finish_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          {:else}
            <span class="text-slate-500 dark:text-slate-400">Tanggal belum ditambahkan</span>
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
