<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchDashboard, getToken } from '$lib/api';
  import { goto } from '$app/navigation';

  let loading = true;
  let errorMessage: string | null = null;
  let dashboard: any = null;

  onMount(async () => {
    const token = getToken();
    if (!token) {
      goto('/auth/login');
      return;
    }
    try {
      const response: any = await fetchDashboard();
      dashboard = response?.data ?? response;
    } catch (err: any) {
      errorMessage = err?.message || 'Gagal memuat dashboard';
    } finally {
      loading = false;
    }
  });

  function formatDate(d: string | Date) {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function statusBadgeClasses(status: string) {
    switch (status) {
      case 'Complete':
      case 'Aktif':
        return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300';
      case 'Ongoing':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-300';
      case 'Prospect':
      case 'Belum':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-300';
      case 'Cancel':
      case 'Tidak Aktif':
        return 'bg-rose-500/20 text-rose-600 dark:text-rose-300';
      default:
        return 'bg-slate-500/20 text-slate-600 dark:text-slate-300';
    }
  }
</script>

<!-- perhatikan: container utama sudah disediakan di +layout.svelte -->
<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-end justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Dashboard
      </h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Ringkasan terbaru project & aktivitas.
      </p>
    </div>
  </div>

  {#if loading}
    <!-- Skeletons -->
    <div class="grid gap-6 md:grid-cols-2">
      {#each Array(2) as _}
        <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#12101d]/60 backdrop-blur shadow-sm">
          <div class="p-5">
            <div class="h-5 w-40 rounded-md bg-slate-200 dark:bg-white/10 animate-pulse"></div>
            <div class="mt-4 space-y-3">
              {#each Array(4) as __}
                <div class="h-12 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else if errorMessage}
    <!-- Error -->
    <div class="rounded-2xl border border-rose-300/60 dark:border-rose-400/30 bg-rose-50/70 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 p-4">
      {errorMessage}
    </div>
  {:else}
    <!-- Content -->
    <div class="grid gap-6 md:grid-cols-2">
      <!-- Project Terbaru -->
      <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
        <div class="flex items-center justify-between p-4 sm:p-5">
          <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Project Terbaru</h2>
          <a href="/projects" class="text-xs font-medium text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
            Lihat semua →
          </a>
        </div>

        {#if (dashboard?.latest_projects ?? []).length === 0}
          <div class="px-4 sm:px-5 pb-5">
            <div class="rounded-xl border border-dashed border-slate-300/60 dark:border-white/10 p-5 text-center">
              <p class="text-sm text-slate-500 dark:text-slate-400">Belum ada project terbaru.</p>
            </div>
          </div>
        {:else}
          <ul class="divide-y divide-slate-200/60 dark:divide-white/10">
            {#each dashboard.latest_projects as p (p.id)}
              <li>
                <a data-sveltekit-prefetch href={`/projects/${p.id}`}
                   class="block p-4 sm:p-5 hover:bg-violet-600/5 dark:hover:bg-white/5 transition">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                    <div class="flex flex-shrink-0 items-center gap-2">
                      <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold {statusBadgeClasses(p.status)}">
                        {p.status}
                      </span>
                      {#if p.is_cert_projects}
                        <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">
                          Certificate
                        </span>
                      {/if}
                    </div>
                  </div>

                  <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p class="text-slate-600 dark:text-slate-300">
                      Customer: {p.mitra?.nama || '-'}
                    </p>
                    <p class="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6z" clip-rule="evenodd"/>
                      </svg>
                      Mulai: {formatDate(p.start_date)}
                    </p>
                  </div>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <!-- Aktivitas Terbaru -->
      <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
        <div class="flex items-center justify-between p-4 sm:p-5">
          <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Aktivitas Terbaru</h2>
          <a href="/activities" class="text-xs font-medium text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
            Lihat semua →
          </a>
        </div>

        {#if (dashboard?.latest_activities ?? []).length === 0}
          <div class="px-4 sm:px-5 pb-5">
            <div class="rounded-xl border border-dashed border-slate-300/60 dark:border-white/10 p-5 text-center">
              <p class="text-sm text-slate-500 dark:text-slate-400">Belum ada aktivitas terbaru.</p>
            </div>
          </div>
        {:else}
          <ul class="divide-y divide-slate-200/60 dark:divide-white/10">
            {#each dashboard.latest_activities as a (a.id)}
              <li>
                <a data-sveltekit-prefetch href={`/activities/${a.id}`}
                   class="block p-4 sm:p-5 hover:bg-violet-600/5 dark:hover:bg-white/5 transition">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {a.name || a.nama || 'Aktivitas'}
                    </p>
                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-700 dark:text-slate-300">
                      {a.kategori || 'Aktivitas'}
                    </span>
                  </div>

                  <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p class="text-slate-600 dark:text-slate-300">
                      Project: {a.project?.name || '-'}{#if a.jenis} · Jenis: {a.jenis}{/if}
                    </p>
                    <p class="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6z" clip-rule="evenodd"/>
                      </svg>
                      {formatDate(a.activity_date || a.created_at)}
                    </p>
                  </div>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  {/if}
</div>
