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
    period: string;
  }

  let loading = false;
  let reportData: FinanceItem[] = [];
  let meta: FinanceMeta = { total_records: 0, total_value: 0, period: '' };
  let showDetailDrawer = false;
  let selectedFinanceItem: FinanceItem | null = null;

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
    try {
      // Gunakan apiFetch dari V2 lib, pass auth: true
      const res = await apiFetch<{ data: FinanceItem[], meta: FinanceMeta }>(
        `/finance/monthly-report?month=${selectedMonth}&year=${selectedYear}`, 
        { auth: true }
      );
      reportData = res.data;
      meta = res.meta;
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil laporan keuangan');
    } finally {
      loading = false;
    }
  }

  function formatRupiah(val: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  }

  onMount(() => {
    fetchReport();
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
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dokumen Keuangan</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">Rekapitulasi aktivitas keuangan per bulan</p>
    </div>

    <div class="flex items-center gap-2 p-1.5 rounded-lg border border-black/5 dark:border-white/10 bg-white/50 dark:bg-[#12101d]/50 backdrop-blur-sm">
      <select 
        bind:value={selectedMonth} 
        on:change={fetchReport} 
        class="text-sm rounded-md border-0 bg-white/50 dark:bg-[#12101d]/50 backdrop-blur-sm py-1.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500"
      >
        {#each months as m}
          <option value={m.val}>{m.label}</option>
        {/each}
      </select>
      <div class="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
      <select 
        bind:value={selectedYear} 
        on:change={fetchReport} 
        class="text-sm rounded-md border-0 bg-white/50 dark:bg-[#12101d]/50 backdrop-blur-sm py-1.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500"
      >
        {#each years as y}
          <option value={y}>{y}</option>
        {/each}
      </select>
      <button 
        on:click={fetchReport} 
        class="ml-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
      >
        Refresh
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#12101d] p-6 shadow-sm">
      <div class="absolute top-0 right-0 p-4 opacity-10">
        <svg class="w-16 h-16 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>
      </div>
      <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Nilai (Bulan Ini)</p>
      <h2 class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
        {formatRupiah(meta.total_value || 0)}
      </h2>
      <p class="text-xs text-slate-400 mt-2">Dari total {meta.total_records} transaksi</p>
    </div>
  </div>

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