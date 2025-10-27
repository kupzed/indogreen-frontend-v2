<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string = 'Attachment Files';
  export let id: string = 'file-attachment';
  export let accept: string =
    'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain';
  export let files: File[] = [];
  export let fileNames: string[] = [];
  export let fileDescriptions: string[] = [];
  export let placeholder: string =
    'PDF, PNG, JPG, DOC, DOCX, XLS, XLSX, TXT, maksimal 10MB per file';
  export let maxFiles: number = 10;
  export let showRemoveButton: boolean = true;
  export let selectedFileText: string = 'File terpilih';
  export let maxSizeBytes: number = 10 * 1024 * 1024; // 10MB (match backend)

  const dispatch = createEventDispatcher();

  let fileInput: HTMLInputElement;
  let isDragOver = false;
  let errorMsg: string | null = null;

  function dedupeBySignature(arr: File[]) {
    const seen = new Set<string>();
    const out: File[] = [];
    for (const f of arr) {
      const sig = `${f.name}|${f.size}|${f.lastModified}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        out.push(f);
      }
    }
    return out;
  }

  function validateFiles(arr: File[]): { ok: boolean; reason?: string } {
    for (const f of arr) {
      if (maxSizeBytes && f.size > maxSizeBytes) {
        return { ok: false, reason: `Ukuran "${f.name}" melebihi ${formatFileSize(maxSizeBytes)}.` };
      }
    }
    return { ok: true };
  }

  function syncToInput(current: File[]) {
    if (!fileInput) return;
    if (current.length > 0) {
      const dt = new DataTransfer();
      current.forEach((f) => dt.items.add(f));
      fileInput.files = dt.files;
    } else {
      fileInput.value = '';
    }
  }

  function emitChange() {
    dispatch('change', { files, fileNames, fileDescriptions });
  }

  function applyFiles(nextFiles: File[]) {
    files = nextFiles;
    fileNames = files.map((f, i) => fileNames[i] ?? f.name);
    fileDescriptions = files.map((_, i) => fileDescriptions[i] ?? '');
    syncToInput(files);
    emitChange();
  }

  function appendFiles(newOnes: File[]) {
    errorMsg = null;
    const combined = dedupeBySignature([...files, ...newOnes]);
    const limited = combined.slice(0, maxFiles);
    const { ok, reason } = validateFiles(limited);
    if (!ok) {
      errorMsg = reason ?? 'File tidak valid.';
      return;
    }
    applyFiles(limited);
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files || []);
    // Tambah, bukan ganti:
    appendFiles(selectedFiles);
  }

  function handleRemoveFile(index: number) {
    files = files.filter((_, i) => i !== index);
    fileNames = fileNames.filter((_, i) => i !== index);
    fileDescriptions = fileDescriptions.filter((_, i) => i !== index);
    applyFiles(files);
    dispatch('remove', { index, files, fileNames, fileDescriptions });
  }

  function handleRemoveAll() {
    files = [];
    fileNames = [];
    fileDescriptions = [];
    applyFiles(files);
    dispatch('clear', {});
  }

  function handleDragEnter() { isDragOver = true; }
  function handleDragOver(e: DragEvent) { e.preventDefault(); isDragOver = true; }
  function handleDragLeave(e: DragEvent) { if (e.currentTarget === e.target) isDragOver = false; }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (droppedFiles.length > 0) appendFiles(droppedFiles);
  }

  function triggerPicker() { fileInput?.click(); }

  function formatFileSize(bytes: number): string {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  function shortenMiddle(name: string, max = 36) {
    if (!name || name.length <= max) return name;
    const head = Math.ceil((max - 1) / 2);
    const tail = Math.floor((max - 1) / 2);
    return `${name.slice(0, head)}…${name.slice(-tail)}`;
  }

  function getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': case 'svg': return '🖼️';
      case 'doc': case 'docx': return '📝';
      case 'xls': case 'xlsx': return '📊';
      case 'txt': return '📃';
      case 'mp4': case 'avi': case 'mov': case 'wmv': case 'flv': case 'webm': return '🎥';
      case 'mp3': case 'wav': case 'ogg': case 'm4a': return '🎵';
      default: return '📎';
    }
  }

  function updateFileName(index: number, newName: string) {
    fileNames[index] = newName;
    dispatch('nameChange', { index, name: newName });
  }
  function updateFileDesc(index: number, newVal: string) {
    fileDescriptions[index] = newVal;
    dispatch('descriptionChange', { index, description: newVal });
  }

  function handleContainerClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    // Abaikan klik pada elemen interaktif supaya tidak membuka file picker
    if (target.closest('input, textarea, button, [role="button"], a, svg')) {
      return;
    }
    triggerPicker();
  }

  $: totalSize = files.reduce((total, file) => total + file.size, 0);
  $: canAddMore = files.length < maxFiles;
</script>

<div class="w-full">
  <div class="flex items-center justify-between gap-3">
    <label for={id} class="block text-sm/6 font-medium text-gray-900 dark:text-white">
      {label} (Opsional) — Maksimal {maxFiles} file
    </label>

    <div class="flex items-center gap-2">
      {#if canAddMore}
        <button
          type="button"
          on:click={triggerPicker}
          class="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Tambah file
        </button>
      {/if}

      {#if files.length > 0}
        <button
          type="button"
          on:click={handleRemoveAll}
          class="inline-flex items-center gap-1 rounded-md bg-gray-200 dark:bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Hapus semua
        </button>
      {/if}
    </div>
  </div>

  <input
    id={id}
    type="file"
    accept={accept}
    multiple
    class="sr-only"
    bind:this={fileInput}
    on:change={handleFileChange}
  />

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="mt-2 block w-full rounded-lg border-2 border-dashed p-5 sm:p-6 text-center transition
          bg-white dark:bg-neutral-900 border-gray-300
          dark:border-gray-700 cursor-pointer
          hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-neutral-800
          {isDragOver ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20' : ''}"
    aria-label="Upload files"
    on:click={handleContainerClick}
    on:dragenter={handleDragEnter}
    on:dragover|preventDefault={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop|preventDefault={handleDrop}
  >
    {#if files.length > 0}
      <div class="space-y-3 text-left">
        {#each files as file, index}
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span class="text-xl shrink-0">{getFileIcon(file.name)}</span>
            <div class="min-w-0 flex-1 space-y-2">
              <input
                type="text"
                bind:value={fileNames[index]}
                required
                on:click|stopPropagation
                on:mousedown|stopPropagation
                on:input={(e) => updateFileName(index, (e.target as HTMLInputElement).value)}
                placeholder="Nama file"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="text"
                bind:value={fileDescriptions[index]}
                required
                on:click|stopPropagation
                on:mousedown|stopPropagation
                on:input={(e) => updateFileDesc(index, (e.target as HTMLInputElement).value)}
                placeholder="Deskripsi file"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span title={file.name} class="truncate">{shortenMiddle(file.name)}</span>
                <span class="ml-2">{formatFileSize(file.size)}</span>
                <span class="ml-auto flex items-center gap-1">
                  <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {selectedFileText}
                </span>
              </div>
            </div>
            {#if showRemoveButton}
              <button
                type="button"
                on:click|stopPropagation={() => handleRemoveFile(index)}
                class="shrink-0 p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300
                      hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                aria-label={`Hapus ${file.name}`}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="space-y-2 pointer-events-none">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            <span class="font-medium text-indigo-600 dark:text-indigo-400">Klik untuk upload files</span>
            atau drag & drop
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{placeholder}</p>
        </div>
      </div>
    {/if}
  </div>

  {#if errorMsg}
    <p class="mt-2 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
  {/if}

  {#if files.length > 0}
    <div class="mt-3 flex items-center justify-between gap-2 flex-wrap">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        {files.length}/{maxFiles} file terpilih
      </span>
      <span class="text-xs text-gray-500 dark:text-gray-400">Total: {formatFileSize(totalSize)}</span>
    </div>
  {/if}
</div>

<style>
  :global(.break-all){ word-break: break-all; overflow-wrap: anywhere; }
</style>
