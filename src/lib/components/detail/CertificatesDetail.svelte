<script lang="ts">
  import { storageUrl } from "$lib/utils/url";
  export let certificates: any = null;

  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case "Aktif": return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
      case "Tidak Aktif": return "bg-rose-500/20 text-rose-700 dark:text-rose-300";
      case "Belum": return "bg-amber-500/20 text-amber-700 dark:text-amber-300";
      default: return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
    }
  }

  type NormalizedAttachment = {
    url: string;
    filename: string;
    displayName: string;
    desc?: string;
    sizeLabel?: string;
  };

  function filenameFromPath(path: string) {
    try { const clean = decodeURIComponent(path); return (clean.split("/").pop() ?? clean) || clean; }
    catch { return (path.split("/").pop() ?? path) || path; }
  }

  function formatBytes(bytes?: number) {
    if (bytes === undefined || !Number.isFinite(bytes)) return undefined;
    let n = Number(bytes);
    const units = ["bytes", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    const rounded = i === 0 ? Math.round(n) : n < 10 ? n.toFixed(1) : Math.round(n).toString();
    return `${rounded}${units[i]}`;
  }

  function normalizeAttachments(att: any): NormalizedAttachment[] {
    if (!att) return [];
    const conv = (a: any): NormalizedAttachment | null => {
      if (!a) return null;
      if (typeof a === "string") {
        const filename = filenameFromPath(a);
        return { url: storageUrl(a), filename, displayName: filename };
      }
      const url = a?.url ?? (a?.path ? storageUrl(a.path) : a?.file ? storageUrl(a.file) : "");
      if (!url) return null;

      const filename = filenameFromPath(a?.path ?? a?.file ?? a?.url ?? "");
      const displayName = a?.label ?? a?.nama ?? a?.title ?? a?.name ?? filename;
      const desc = a?.description ?? a?.deskripsi ?? a?.keterangan ?? a?.caption ?? undefined;
      const sizeLabel = a?.sizeLabel ?? formatBytes(a?.size);
      return { url, filename, displayName, desc, sizeLabel };
    };
    return (Array.isArray(att) ? att.map(conv) : [conv(att)]).filter(Boolean) as NormalizedAttachment[];
  }

  $: attachments = normalizeAttachments(certificates?.attachments ?? certificates?.attachment);
</script>

{#if certificates}
  <div class="bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm border border-black/5 dark:border-white/10 overflow-hidden">
    <dl class="divide-y divide-black/5 dark:divide-white/10">
      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Nama</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{certificates.name}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">No. Sertifikat</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{certificates.no_certificate}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Barang</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if certificates.barang_certificate}
            <a href={`/barang-certificates/${certificates.barang_certificate.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">
              {certificates.barang_certificate.name}
            </a>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Project</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if certificates.project}
            <a href={`/projects/${certificates.project.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{certificates.project.name}</a>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Status</dt>
        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
          <span class={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusBadgeClasses(certificates.status)}`}>
            {certificates.status}
          </span>
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Tanggal Terbit</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if certificates.date_of_issue}
            {new Date(certificates.date_of_issue).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          {:else}
            <span class="text-slate-500 dark:text-slate-400">-</span>
          {/if}
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Tanggal Expired</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if certificates.date_of_expired}
            {new Date(certificates.date_of_expired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          {:else}
            <span class="text-slate-500 dark:text-slate-400">-</span>
          {/if}
        </dd>
      </div>

      <!-- Lampiran -->
      <div class="px-4 py-3 sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm mb-2 font-medium text-slate-500 dark:text-slate-300">Lampiran</dt>
        <dd class="mt-1 text-sm grid grid-cols-1 sm:col-span-2">
          {#if attachments.length}
            <ul class="rounded-md border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10">
              {#each attachments as file}
                <li class="py-3 pr-4 pl-4">
                  <div class="flex items-start gap-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="w-5 h-5 shrink-0 text-slate-500 mt-0.5">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z" />
                    </svg>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-slate-900 dark:text-white">{file.displayName}</span>
                        {#if file.sizeLabel}<span class="shrink-0 text-xs text-slate-500 dark:text-slate-400">{file.sizeLabel}</span>{/if}
                      </div>
                      {#if file.desc}<p class="mt-1 text-xs text-slate-600 dark:text-slate-300">{file.desc}</p>{/if}
                    </div>
                    <div class="shrink-0">
                      <a href={file.url} target="_blank" rel="noopener" download
                         class="inline-flex items-center justify-center rounded-xl p-1.5 border border-black/10 dark:border-white/10
                                hover:bg-violet-600/10 text-violet-700 dark:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                         aria-label={`Download ${file.displayName}`} title={`Download ${file.displayName}`}>
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 21h14" /></svg>
                        <span class="sr-only">Download</span>
                      </a>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <span class="text-slate-500 dark:text-slate-400">Tidak ada file</span>
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
