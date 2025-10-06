<script lang="ts">
  import { storageUrl } from "$lib/utils/url";
  
  export let certificates: any = null;

  // === Badge konsisten dark ===
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Tidak Aktif': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Belum': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  // ====== Helpers Lampiran ======
  type NormalizedAttachment = { name: string; url: string; sizeLabel?: string };

  function filenameFromPath(path: string) {
    try {
      const clean = decodeURIComponent(path);
      return (clean.split("/").pop() ?? clean) || clean;
    } catch {
      return (path.split("/").pop() ?? path) || path;
    }
  }

  function formatBytes(bytes?: number) {
    if (bytes === undefined || !Number.isFinite(bytes)) return undefined;
    let n = bytes;
    const units = ["bytes", "kb", "mb", "gb", "tb"];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    const rounded = i === 0 ? Math.round(n) : n < 10 ? n.toFixed(1) : Math.round(n).toString();
    return `${rounded}${units[i]}`;
  }

  function normalizeAttachments(att: any): NormalizedAttachment[] {
    if (!att) return [];
    // Array
    if (Array.isArray(att)) {
      return att.map((a: any) => {
        if (typeof a === "string") {
          return { name: filenameFromPath(a), url: storageUrl(a) };
        }
        const url =
          a?.url ??
          (a?.path ? storageUrl(a.path) : a?.file ? storageUrl(a.file) : "");
        const name = a?.name ?? filenameFromPath(a?.path ?? a?.file ?? a?.url ?? "");
        const sizeLabel = a?.sizeLabel ?? formatBytes(a?.size);
        return url ? { name, url, sizeLabel } : null;
      }).filter(Boolean) as NormalizedAttachment[];
    }
    // Single string
    if (typeof att === "string") {
      return [{ name: filenameFromPath(att), url: storageUrl(att) }];
    }
    // Single object
    if (typeof att === "object") {
      const url =
        att?.url ??
        (att?.path ? storageUrl(att.path) : att?.file ? storageUrl(att.file) : "");
      const name = att?.name ?? filenameFromPath(att?.path ?? att?.file ?? att?.url ?? "");
      const sizeLabel = att?.sizeLabel ?? formatBytes(att?.size);
      return url ? [{ name, url, sizeLabel }] : [];
    }
    return [];
  }

  // Mendukung certificates.attachment (single) atau certificates.attachments (array)
  $: attachments = normalizeAttachments(certificates?.attachments ?? certificates?.attachment);
</script>

{#if certificates}
  <div class="bg-white dark:bg-black shadow border border-gray-200 dark:border-neutral-800 overflow-hidden sm:rounded-md">
    <dl class="divide-y divide-gray-100 dark:divide-gray-800">
      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Nama</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {certificates.name}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">No. Sertifikat</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {certificates.no_certificate}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Barang</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {#if certificates.barang_certificate}
            <a href={`/barang-certificates/${certificates.barang_certificate.id}`} class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
              {certificates.barang_certificate.name}
            </a>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Project</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {#if certificates.project}
            <a href={`/projects/${certificates.project.id}`} class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
              {certificates.project.name}
            </a>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Status</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusBadgeClasses(certificates.status)}">
            {certificates.status}
          </span>
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Tanggal Terbit</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {#if certificates.date_of_issue}
            {new Date(certificates.date_of_issue).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          {:else}
            <span class="text-gray-500 dark:text-gray-400">-</span>
          {/if}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Tanggal Expired</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {#if certificates.date_of_expired}
            {new Date(certificates.date_of_expired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          {:else}
            <span class="text-gray-500 dark:text-gray-400">-</span>
          {/if}
        </dd>
      </div>

      <div class="bg-white dark:bg-black px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Lampiran</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
          {#if attachments.length}
            <ul role="list" class="divide-y divide-gray-100 dark:divide-white/5 rounded-md border border-gray-200/80 dark:border-white/20">
              {#each attachments as file}
                <li class="flex items-center justify-between py-4 pr-5 pl-4 text-sm">
                  <div class="flex w-0 flex-1 items-center">
                    <!-- Icon -->
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="w-5 h-5 shrink-0 text-gray-500">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z" />
                    </svg>
                    <div class="ml-4 flex min-w-0 flex-1 gap-2">
                      <span class="truncate font-medium text-gray-900 dark:text-white">{file.name}</span>
                      {#if file.sizeLabel}
                        <span class="shrink-0 text-gray-500">{file.sizeLabel}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="relative ml-4 shrink-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener"
                      download
                      class="inline-flex items-center justify-center rounded-md p-1 hover:bg-gray-100 dark:hover:bg-white/10
                             text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      aria-label={`Download ${file.name}`}
                      title={`Download ${file.name}`}
                    >
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 3v12m0 0 4-4m-4 4-4-4"></path>
                        <path d="M5 21h14"></path>
                      </svg>
                      <span class="sr-only">Download</span>
                    </a>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <span class="text-gray-500 dark:text-gray-400">Tidak ada file</span>
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
