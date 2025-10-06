<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string = 'Attachment File';
  export let id: string = 'file-attachment';
  export let accept: string = 'image/*,application/pdf';
  export let file: File | null = null;
  export let fileName: string = '';
  export let placeholder: string = 'PDF, PNG, JPG, maksimal 10MB';
  export let showRemoveButton: boolean = false;
  export let removeButtonText: string = 'Hapus File';
  export let currentFileText: string = 'File saat ini';
  export let selectedFileText: string = 'File terpilih';

  const dispatch = createEventDispatcher();

  let fileInput: HTMLInputElement;
  let isDragOver = false;

  function applyFile(selected: File | null) {
    file = selected;
    fileName = selected ? selected.name : '';

    // Sinkronkan ke <input type="file"> supaya form submission tetap benar
    if (fileInput) {
      if (selected) {
        const dt = new DataTransfer();
        dt.items.add(selected);
        fileInput.files = dt.files;
      } else {
        fileInput.value = '';
      }
    }

    dispatch('change', { file: selected, fileName });
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    applyFile(selected);
  }

  function handleRemoveFile() {
    applyFile(null);
    dispatch('remove', { file: null, fileName: '' });
  }

  function handleDragEnter() { isDragOver = true; }
  function handleDragOver(e: DragEvent) { e.preventDefault(); isDragOver = true; }
  function handleDragLeave(e: DragEvent) {
    // Pastikan benar2 keluar dari zona (bukan pindah ke child)
    if (e.currentTarget === e.target) isDragOver = false;
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    const dropped = e.dataTransfer?.files?.[0] ?? null;
    if (dropped) applyFile(dropped);
  }

  function formatFileSize(bytes: number): string {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  function shortenMiddle(name: string, max = 36) {
    if (!name || name.length <= max) return name;
    const head = Math.ceil((max - 1) / 2);
    const tail = Math.floor((max - 1) / 2);
    return `${name.slice(0, head)}…${name.slice(-tail)}`;
  }

  function getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return '🖼️';
      default: return '📎';
    }
  }
</script>

<div class="w-full">
  <label for={id} class="block text-sm/6 font-medium text-gray-900 dark:text-white">
    {label} (Opsional)
  </label>

  <!-- INPUT asli disembunyikan -->
  <input
    id={id}
    type="file"
    accept={accept}
    class="sr-only"
    bind:this={fileInput}
    on:change={handleFileChange}
  />

  <!-- Dropzone -->
  <label
    for={id}
    class="mt-2 block w-full rounded-lg border-2 border-dashed p-5 sm:p-6 text-center transition
           bg-white dark:bg-neutral-900 border-gray-300 hover:border-indigo-400 hover:bg-gray-50
           dark:border-gray-700 dark:hover:bg-neutral-800 cursor-pointer
           {isDragOver ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20' : ''}"
    aria-label="Upload file"
    on:dragenter={handleDragEnter}
    on:dragover|preventDefault={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop|preventDefault={handleDrop}
  >
    {#if fileName}
      <div class="flex items-start sm:items-center gap-3 sm:gap-4">
        <span class="text-2xl shrink-0">{getFileIcon(fileName)}</span>
        <div class="min-w-0 flex-1 text-left">
          <p class="text-sm font-medium text-gray-900 dark:text-white break-all sm:truncate">
            {shortenMiddle(fileName)}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {file ? formatFileSize(file.size) : ''} · {showRemoveButton ? currentFileText : selectedFileText}
          </p>
        </div>
      </div>
    {:else}
      <!-- Empty state -->
      <div class="space-y-2 pointer-events-none">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            <span class="font-medium text-indigo-600 dark:text-indigo-400">Klik untuk upload file</span>
            atau drag & drop
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{placeholder}</p>
        </div>
      </div>
    {/if}
  </label>

  <!-- Actions -->
  {#if fileName}
    <div class="mt-3 flex items-center justify-between gap-2 flex-wrap">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        {showRemoveButton ? 'File Terlampir' : selectedFileText}
      </span>

      <button
        type="button"
        on:click={handleRemoveFile}
        class="ml-auto shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full
               border border-red-200/50 text-red-700 bg-red-50 hover:bg-red-100
               dark:text-red-100 dark:bg-red-900 dark:hover:bg-red-800 dark:border-red-800
               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 transition"
      >
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        {removeButtonText}
      </button>
    </div>
  {/if}
</div>

<style>
  :global(.break-all){ word-break: break-all; overflow-wrap: anywhere; }
</style>
