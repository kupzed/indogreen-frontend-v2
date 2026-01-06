<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';
  import Drawer from '$lib/components/Drawer.svelte';
  import FinanceDetail from '$lib/components/detail/FinanceDetail.svelte';

  // Interface data sesuai respon backend
  interface FinanceItem {
    activity_date: string;
    kategori: string;
    activity_name: string;
    project_name: string;
    value: number;
    value_formatted?: string;
    activity?: Record<string, any>;
  }

  interface FinanceMeta {
    total_records: number;
    total_value: number;
    period?: string;
    project?: { id: number; name: string } | null;
    filters?: Record<string, any>;
  }

  type ReportMode = 'month' | 'project';

  let loading = false;
  let error = '';
  let reportData: FinanceItem[] = [];
  let meta: FinanceMeta = { total_records: 0, total_value: 0, period: '', project: null, filters: {} };
  let showDetailDrawer = false;
  let selectedFinanceItem: FinanceItem | null = null;
  let reportMode: ReportMode = 'month';
  let projects: Array<{ id: number; name: string }> = [];
  let selectedProjectId: number | string = '';
  let projectStartDate = '';
  let projectEndDate = '';

  let selectedMonth = new Date().getMonth() + 1;
  let selectedYear = new Date().getFullYear();

  const months = [
    { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
    { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
    { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
    { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' }
  ];

  const startYear = 2020;
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + 1;
  const years = Array.from({ length: (endYear - startYear) + 1 }, (_, i) => startYear + i);

  async function fetchReport() {
    loading = true;
    error = '';
    try {
      let endpoint = `/finance/monthly-report?month=${selectedMonth}&year=${selectedYear}`;

      if (reportMode === 'project') {
        const normalizedProjectId =
          typeof selectedProjectId === 'number'
            ? selectedProjectId
            : Number(selectedProjectId || 0);

        if (!normalizedProjectId) {
          error = 'Silakan pilih project terlebih dahulu.';
          return;
        }

        if (projectStartDate && projectEndDate) {
          const start = new Date(projectStartDate);
          const end = new Date(projectEndDate);
          if (start > end) {
            error = 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai.';
            return;
          }
        }

        const searchParams = new URLSearchParams({
          project_id: String(normalizedProjectId)
        });
        if (projectStartDate) searchParams.append('start_date', projectStartDate);
        if (projectEndDate) searchParams.append('end_date', projectEndDate);
        endpoint = `/finance/project-report?${searchParams.toString()}`;
      }

      const res = await apiFetch<{ data: FinanceItem[], meta: FinanceMeta }>(
        endpoint,
        { auth: true }
      );
      reportData = res.data;
      meta = res.meta;
    } catch (err: any) {
      error = err?.message || 'Gagal memuat Dokumen Keuangan.';
      console.error(err);

    } finally {
      loading = false;
    }
  }

  async function fetchProjects() {
    try {
      const res = await apiFetch<{ data: Array<{ id: number; name: string }> }>(
        '/projects?per_page=500',
        { auth: true }
      );
      projects = Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      console.error('Gagal memuat daftar project:', err);
    }
  }

  function handleModeChange(mode: ReportMode) {
    if (mode === reportMode) return;
    reportMode = mode;
    error = '';
    reportData = [];
    meta = { total_records: 0, total_value: 0, period: '', project: null, filters: {} };

    if (mode === 'month') {
      selectedProjectId = '';
      projectStartDate = '';
      projectEndDate = '';
      fetchReport();
    }
  }

  function formatRupiah(val: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  }

  $: reportSubtitle = reportMode === 'month'
    ? 'Rekapitulasi aktivitas keuangan per bulan'
    : 'Rekapitulasi aktivitas keuangan per project';

  onMount(() => {
    fetchReport();
    fetchProjects();
  });

  function openFinanceDetailDrawer(item: FinanceItem) {
    selectedFinanceItem = item;
    showDetailDrawer = true;
  }

  function closeFinanceDetailDrawer() {
    showDetailDrawer = false;
  }

  function handleFinanceValueSaved(event: CustomEvent) {
    const detail = event.detail ?? {};
    const activityId = detail.activityId;
    if (!activityId) return;

    reportData = reportData.map((row) => {
      if (row?.activity?.id === activityId) {
        const nextValue = Number(detail.value ?? row.value ?? 0);
        return {
          ...row,
          value: nextValue,
          value_formatted: detail.value_formatted ?? formatRupiah(nextValue),
          activity: detail.activity ?? row.activity
        };
      }
      return row;
    });

    meta = {
      ...meta,
      total_value: reportData.reduce((sum, row) => sum + Number(row.value ?? 0), 0)
    };
  }

  // --- kunci scroll saat membuka drawer & modal ---
  function lockBodyScroll(lock: boolean) {
    const body = document.body;
    if (!body) return;
    if (lock) {
      const scrollY = window.scrollY;
      body.dataset.scrollY = String(scrollY);
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';
      body.style.width = '100%';
    } else {
      const y = Number(body.dataset.scrollY || '0');
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';
      body.style.width = '';
      delete body.dataset.scrollY;
      window.scrollTo(0, y);
    }
  }
  $: lockBodyScroll(showDetailDrawer);
</script>

<div class="space-y-6">
  <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dokumen Keuangan</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{reportSubtitle}</p>
      
      <div class="mt-4 inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
        <label class="relative flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all {reportMode === 'month' ? 'bg-white text-violet-600 shadow-sm dark:bg-violet-600 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}">
          <input
            type="radio"
            name="report-mode"
            class="sr-only"
            checked={reportMode === 'month'}
            on:change={() => handleModeChange('month')}
          />
          <span>Per Bulan</span>
        </label>
        <label class="relative flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all {reportMode === 'project' ? 'bg-white text-violet-600 shadow-sm dark:bg-violet-600 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}">
          <input
            type="radio"
            name="report-mode"
            class="sr-only"
            checked={reportMode === 'project'}
            on:change={() => handleModeChange('project')}
          />
          <span>Per Project</span>
        </label>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-2 p-2 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-[#12101d]/50 backdrop-blur-md shadow-sm">
      {#if reportMode === 'month'}
        <select 
          bind:value={selectedMonth} 
          on:change={fetchReport} 
          class="h-10 w-full sm:w-40 rounded-lg border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#1a1728]/80 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:ring-violet-500"
        >
          {#each months as m}
            <option value={m.val}>{m.label}</option>
          {/each}
        </select>

        <select 
          bind:value={selectedYear} 
          on:change={fetchReport} 
          class="h-10 w-full sm:w-28 rounded-lg border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#1a1728]/80 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:ring-violet-500"
        >
          {#each years as y}
            <option value={y}>{y}</option>
          {/each}
        </select>

      {:else}
        <select 
          bind:value={selectedProjectId} 
          on:change={fetchReport} 
          class="h-10 w-full sm:w-48 rounded-lg border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#1a1728]/80 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:ring-violet-500"
        >
          <option value="">Pilih Project</option>
          {#each projects as project}
            <option value={project.id}>{project.name}</option>
          {/each}
        </select>

        <input 
          type="date" 
          bind:value={projectStartDate} 
          on:change={fetchReport} 
          class="h-10 w-full sm:w-auto rounded-lg border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#1a1728]/80 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:ring-violet-500" 
        />
        
        <span class="hidden sm:flex items-center text-slate-400">-</span>

        <input 
          type="date" 
          bind:value={projectEndDate} 
          on:change={fetchReport} 
          class="h-10 w-full sm:w-auto rounded-lg border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#1a1728]/80 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:ring-violet-500" 
        />
      {/if}

      <button 
        on:click={fetchReport} 
        class="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
      >
        Refresh
      </button>
    </div>
  </div>

  <!-- <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#12101d] p-6 shadow-sm">
      <div class="absolute top-0 right-0 p-4 opacity-10">
        <svg class="w-16 h-16 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>
      </div>
      <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {reportMode === 'month' ? 'Total Nilai (Periode Terpilih)' : 'Total Nilai (Project Terpilih)'}
      </p>
      <h2 class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
        {formatRupiah(meta.total_value || 0)}
      </h2>
      <p class="text-xs text-slate-400 mt-2">
        {reportMode === 'month' && meta?.period
          ? `Periode ${meta.period}`
          : reportMode === 'project' && meta?.project?.name
            ? `Project ${meta.project.name}`
            : ''}
      </p>
      <p class="text-xs text-slate-400">Dari total {meta.total_records} transaksi</p>
    </div>
  </div> -->

  <div class="bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
    <div class="overflow-x-auto no-scrollbar">
      <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
        <thead>
          <tr class="bg-slate-50/50 dark:bg-white/5 text-xs uppercase text-slate-900 dark:text-slate-100 font-semibold tracking-wider border-b border-black/5 dark:border-white/5">
            <th class="px-4 py-3 text-left">No</th>
            <th class="px-4 py-3 text-left">Tanggal</th>
            <th class="px-4 py-3 text-left">Kategori</th>
            <th class="px-4 py-3 text-left">Activity</th>
            <th class="px-4 py-3 text-left">Project</th>
            <th class="px-4 py-3 text-right">Nilai (IDR)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black/5 dark:divide-white/5 text-sm text-slate-700 dark:text-slate-200">
          {#if loading}
            <tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td></tr>
          {:else if error}
            <tr><td colspan="6" class="px-6 py-8 text-center text-red-600 dark:text-red-400 italic">{error}</td></tr>
          {:else if reportData.length === 0}
            <tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">Tidak ada data keuangan pada periode ini.</td></tr>
          {:else}
            {#each reportData as item, i}
              <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td class="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{i + 1}</td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{item.activity_date}</td>
                <td class="whitespace-nowrap px-4 py-3">
                  <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300">
                    {item.kategori}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  <button
                    type="button"
                    class="text-left font-medium text-violet-700 hover:text-violet-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-violet-300 dark:hover:text-violet-100"
                    on:click={() => openFinanceDetailDrawer(item)}
                    on:keydown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openFinanceDetailDrawer(item);
                      }
                    }}
                  >
                    {item.activity_name}
                  </button>
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{item.project_name}</td>
                <td class="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {formatRupiah(item.value)}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

<Drawer
  bind:show={showDetailDrawer}
  title="Detail Dokumen Keuangan"
  on:close={closeFinanceDetailDrawer}
>
  <FinanceDetail item={selectedFinanceItem} on:saved={handleFinanceValueSaved} />
</Drawer>