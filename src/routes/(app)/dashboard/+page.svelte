<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';
  import Chart from 'chart.js/auto';
  import type { Chart as ChartJS, ChartOptions } from 'chart.js';

  // ==== STATE ====
  let loading = true;
  let errorMessage = '';

  // metric cards
  let totals = {
    total_projects: 0,
    ongoing: 0,
    prospect: 0,
    complete: 0,
    cancel: 0,
    cert_projects: 0,
    cert_active: 0,
    cert_expiring_30: 0
  };

  // list
  let latestProjects: any[] = [];

  // Charts data
  let trend = { labels: [] as string[], counts: [] as number[] };
  let statusDist = { labels: [] as string[], counts: [] as number[] };
  let kategoriDist = { labels: [] as string[], counts: [] as number[] };
  let topCustomers = { labels: [] as string[], counts: [] as number[] };

  // Canvas refs
  let cTrend: HTMLCanvasElement;
  let cStatus: HTMLCanvasElement;
  let cKategori: HTMLCanvasElement;
  let cTopCust: HTMLCanvasElement;

  // Chart instances
  let chartTrend: ChartJS | null = null;
  let chartStatus: ChartJS | null = null;
  let chartKategori: ChartJS | null = null;
  let chartTopCust: ChartJS | null = null;

  // === HELPERS ===
  const STATUS_COLOR: Record<string, string> = {
    Ongoing:  '#3B82F6', // blue-500
    Prospect: '#F59E0B', // amber-500
    Complete: '#10B981', // emerald-500
    Cancel:   '#EF4444', // red-500
  };

  function destroyCharts() {
    chartTrend?.destroy();
    chartStatus?.destroy();
    chartKategori?.destroy();
    chartTopCust?.destroy();
    chartTrend = chartStatus = chartKategori = chartTopCust = null;
  }

  function drawCharts() {
    destroyCharts();

    const ticksInt = { beginAtZero: true, ticks: { precision: 0 as number, stepSize: 1 } };

    // Line: Tren 12 bulan
    chartTrend = new Chart(cTrend, {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [{ label: 'Project', data: trend.counts, tension: 0.35, fill: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: ticksInt },
        plugins: { legend: { display: false } }
      } as ChartOptions<'line'>
    });

    // Doughnut: Distribusi status
    chartStatus = new Chart(cStatus, {
      type: 'doughnut',
      data: {
        labels: statusDist.labels,
        datasets: [{
          data: statusDist.counts,
          backgroundColor: statusDist.labels.map(l => STATUS_COLOR[l] ?? '#9CA3AF'),
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '55%',
        plugins: { legend: { position: 'bottom' } }
      }
    });

    // Bar: Project per kategori
    chartKategori = new Chart(cKategori, {
      type: 'bar',
      data: { labels: kategoriDist.labels, datasets: [{ label: 'Jumlah', data: kategoriDist.counts }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: ticksInt },
        plugins: { legend: { display: false } }
      } as ChartOptions<'bar'>
    });

    // Horizontal bar: Top customers
    chartTopCust = new Chart(cTopCust, {
      type: 'bar',
      data: { labels: topCustomers.labels, datasets: [{ label: 'Project', data: topCustomers.counts }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        scales: { x: ticksInt },
        plugins: { legend: { display: false } }
      } as ChartOptions<'bar'>
    });
  }

  function statusBadgeClasses(status: string) {
    switch (status) {
      case 'Complete': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300';
      case 'Ongoing':  return 'bg-blue-500/20 text-blue-600 dark:text-blue-300';
      case 'Prospect': return 'bg-amber-500/20 text-amber-600 dark:text-amber-300';
      case 'Cancel':   return 'bg-rose-500/20 text-rose-600 dark:text-rose-300';
      default:         return 'bg-slate-500/20 text-slate-600 dark:text-slate-300';
    }
  }

  function formatDate(d: string | Date) {
    if (!d) return '-';
    const date = new Date(d);
    if (isNaN(date as any)) return '-';
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // === DATA FETCH ===
  async function fetchDashboard() {
    loading = true; errorMessage = '';

    try {
      if (!getToken()) { goto('/auth/login'); return; }

      // panggil endpoint dashboard
      const res: any = await apiFetch('/dashboard', { auth: true });
      const d = res?.data ?? res ?? {};

      // Flexible mapping agar aman ke berbagai bentuk payload backend
      latestProjects = d.latest_projects ?? d.projects?.latest ?? [];

      const incomingTotals = d.totals ?? d.total ?? {};
      totals = {
        total_projects: Number(incomingTotals.total_projects ?? incomingTotals.projects ?? 0),
        ongoing: Number(incomingTotals.ongoing ?? 0),
        prospect: Number(incomingTotals.prospect ?? 0),
        complete: Number(incomingTotals.complete ?? 0),
        cancel: Number(incomingTotals.cancel ?? 0),
        cert_projects: Number(incomingTotals.cert_projects ?? 0),
        cert_active: Number(incomingTotals.cert_active ?? 0),
        cert_expiring_30: Number(incomingTotals.cert_expiring_30 ?? 0)
      };

      trend = d.trend_12_months ?? trend;
      statusDist = d.status_distribution ?? statusDist;
      kategoriDist = d.kategori_distribution ?? kategoriDist;
      topCustomers = d.top_customers ?? topCustomers;

      // Render chart setelah DOM ready
      setTimeout(drawCharts, 0);
    } catch (e: any) {
      errorMessage = e?.message || 'Gagal memuat dashboard';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  onMount(fetchDashboard);
  onDestroy(destroyCharts);
</script>

<svelte:head>
  <title>Dashboard - Indogreen</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-end justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Ringkasan terbaru project & sertifikat.</p>
    </div>
    <a href="/projects"
       class="inline-flex items-center text-center h-9 px-3 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm">
      Lihat Semua Project
    </a>
  </div>

  {#if loading}
    <!-- === LOADING SKELETON (sesuai gaya kamu) === -->
    <div class="grid gap-6 xl:grid-cols-2">
      <!-- Kartu metrics -->
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#12101d]/60 backdrop-blur shadow-sm p-5">
        <div class="h-5 w-48 rounded-md bg-slate-200 dark:bg-white/10 animate-pulse"></div>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {#each Array(6) as _}
            <div class="h-16 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
          {/each}
        </div>
      </div>

      <!-- Kartu metrics cert -->
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#12101d]/60 backdrop-blur shadow-sm p-5">
        <div class="h-5 w-56 rounded-md bg-slate-200 dark:bg-white/10 animate-pulse"></div>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {#each Array(3) as _}
            <div class="h-16 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
          {/each}
        </div>
      </div>

      <!-- Charts -->
      {#each Array(4) as _}
        <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#12101d]/60 backdrop-blur shadow-sm p-4">
          <div class="h-5 w-40 rounded-md bg-slate-200 dark:bg-white/10 animate-pulse"></div>
          <div class="mt-3 h-[280px] rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
        </div>
      {/each}

      <!-- List -->
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#12101d]/60 backdrop-blur shadow-sm p-4 xl:col-span-2">
        <div class="h-5 w-44 rounded-md bg-slate-200 dark:bg-white/10 animate-pulse"></div>
        <div class="mt-4 space-y-3">
          {#each Array(5) as __}
            <div class="h-12 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
          {/each}
        </div>
      </div>
    </div>
  {:else if errorMessage}
    <!-- Error -->
    <div class="rounded-2xl border border-rose-300/60 dark:border-rose-400/30 bg-rose-50/70 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 p-4">
      {errorMessage}
    </div>
  {:else}
    <!-- === CONTENT === -->

    <!-- Metric cards Project (Custom layout, gaya glassy kamu) -->
    <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm p-4">
      <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Project</h2>
      <div class="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <div class="col-span-2 rounded-xl p-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
          <div class="text-xs text-slate-500 dark:text-slate-400">Total Project</div>
          <div class="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{totals.total_projects}</div>
        </div>
        <div class="rounded-xl p-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
          <div class="text-xs text-blue-500">Ongoing</div>
          <div class="mt-2 text-3xl font-bold text-blue-500">{totals.ongoing}</div>
        </div>
        <div class="rounded-xl p-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
          <div class="text-xs text-amber-500">Prospect</div>
          <div class="mt-2 text-3xl font-bold text-amber-500">{totals.prospect}</div>
        </div>
        <div class="rounded-xl p-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
          <div class="text-xs text-emerald-500">Complete</div>
          <div class="mt-2 text-3xl font-bold text-emerald-500">{totals.complete}</div>
        </div>
        <div class="rounded-xl p-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
          <div class="text-xs text-rose-500">Cancel</div>
          <div class="mt-2 text-3xl font-bold text-rose-500">{totals.cancel}</div>
        </div>
      </div>
    </section>

    <!-- Metric cards Certificate Project -->
    <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm p-4">
      <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Certificate</h2>
      <div class="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="col-span-2 rounded-xl p-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
          <div class="text-xs text-violet-500">Cert Project</div>
          <div class="mt-2 text-3xl font-bold text-violet-500">{totals.cert_projects}</div>
        </div>
        <div class="rounded-xl p-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
          <div class="text-xs text-emerald-500">Sertifikat Aktif</div>
          <div class="mt-2 text-3xl font-bold text-emerald-500">{totals.cert_active}</div>
        </div>
        <div class="rounded-xl p-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
          <div class="text-xs text-orange-500">Expired ≤ 30 hari</div>
          <div class="mt-2 text-3xl font-bold text-orange-500">{totals.cert_expiring_30}</div>
        </div>
      </div>
    </section>

    <!-- Charts grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm p-4">
        <div class="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Tren Project 12 Bulan</div>
        <div class="w-full h-[280px]">
          <canvas bind:this={cTrend} class="w-full h-full"></canvas>
        </div>
      </div>

      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm p-4">
        <div class="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Distribusi Status</div>
        <div class="w-full h-[280px]">
          <canvas bind:this={cStatus} class="w-full h-full"></canvas>
        </div>
      </div>

      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm p-4">
        <div class="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Project per Kategori</div>
        <div class="w-full h-[280px]">
          <canvas bind:this={cKategori} class="w-full h-full"></canvas>
        </div>
      </div>

      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm p-4">
        <div class="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Top Customer (by Project)</div>
        <div class="w-full h-[280px]">
          <canvas bind:this={cTopCust} class="w-full h-full"></canvas>
        </div>
      </div>
    </div>

    <!-- Project Terbaru -->
    <section class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
      <div class="flex items-center justify-between p-4 sm:p-5">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Project Terbaru</h2>
        <a href="/projects" class="text-xs font-medium text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">Lihat semua →</a>
      </div>

      {#if (latestProjects ?? []).length === 0}
        <div class="px-4 sm:px-5 pb-5">
          <div class="rounded-xl border border-dashed border-slate-300/60 dark:border-white/10 p-5 text-center">
            <p class="text-sm text-slate-500 dark:text-slate-400">Belum ada project terbaru.</p>
          </div>
        </div>
      {:else}
        <ul class="divide-y divide-slate-200/60 dark:divide-white/10">
          {#each latestProjects as p (p.id)}
            <li>
              <a data-sveltekit-prefetch href={`/projects/${p.id}`} class="block p-4 sm:p-5 hover:bg-violet-600/5 dark:hover:bg-white/5 transition">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-medium text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                  <div class="flex flex-shrink-0 items-center gap-2">
                    <span class={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " + statusBadgeClasses(p.status)}>{p.status}</span>
                    {#if p.is_cert_projects}
                      <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">Certificate</span>
                    {/if}
                  </div>
                </div>
                <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p class="text-slate-600 dark:text-slate-300">Customer: {p.mitra?.nama || '-'}</p>
                  <p class="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6z" clip-rule="evenodd"/></svg>
                    Mulai: {formatDate(p.start_date)}
                  </p>
                </div>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</div>
