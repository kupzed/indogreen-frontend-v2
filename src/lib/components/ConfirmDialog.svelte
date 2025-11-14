<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  export let open = false;
  export let title = 'Konfirmasi';
  export let message = 'Apakah Anda yakin?';
  export let confirmText = 'Ya';
  export let cancelText = 'Batal';
  export let pending = false; // spinner di tombol konfirmasi

  const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();

  let dialogEl: HTMLDivElement;
  let panelEl: HTMLDivElement;
  let cancelBtn: HTMLButtonElement;

  // id unik untuk a11y
  const uid = Math.random().toString(36).slice(2);
  const titleId = `confirm-title-${uid}`;
  const descId  = `confirm-desc-${uid}`;

  onMount(() => {
    if (open) {
      // fokuskan container dialog (a11y), lalu tombol batal
      queueMicrotask(() => {
        dialogEl?.focus();
        cancelBtn?.focus();
      });
    }
  });

  // kunci scroll body saat modal terbuka
  $: document?.body && (document.body.style.overflow = open ? 'hidden' : '');

  const onBackdropClick = () => dispatch('cancel');
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dispatch('cancel');
  };
</script>

{#if open}
  <div
    class="fixed inset-0 z-[100]"
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    aria-describedby={descId}
    tabindex="-1"
    bind:this={dialogEl}
    on:keydown={onKeydown}
  >
    <!-- Backdrop -->
    <button
      class="absolute inset-0 bg-black/50"
      on:click={onBackdropClick}
      aria-label="Tutup"
      transition:fade={{ duration: 120 }}
    ></button>

    <!-- Panel -->
    <div
      bind:this={panelEl}
      in:fly={{ y: 14, duration: 150, opacity: 0.2 }}
      out:fly={{ y: 10, duration: 120, opacity: 0 }}
      class="absolute left-1/2 top-[12vh] -translate-x-1/2 w-[92vw] max-w-md
             rounded-2xl border border-black/5 dark:border-white/10
             supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-[#0e0c19]/70
             bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur shadow-2xl"
    >
      <div class="p-5">
        <div class="flex items-start gap-3">
          <div class="mt-0.5 h-9 w-9 shrink-0 grid place-items-center rounded-xl
                      bg-rose-500/15 text-rose-600 dark:text-rose-300">
            <!-- icon alert -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-width="2" d="M12 9v4m0 4h.01"/>
              <path stroke-width="2" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
            </svg>
          </div>

          <div class="min-w-0">
            <h3 id={titleId} class="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p id={descId} class="mt-1 text-sm text-slate-600 dark:text-slate-300">{message}</p>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            bind:this={cancelBtn}
            type="button"
            class="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium
                   border border-black/5 dark:border-white/10
                   bg-slate-100/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10
                   text-slate-700 dark:text-slate-200"
            on:click={() => dispatch('cancel')}
          >
            {cancelText}
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-semibold
                   text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-60"
            disabled={pending}
            on:click={() => dispatch('confirm')}
          >
            {#if pending}
              <svg class="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"/>
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            {/if}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
