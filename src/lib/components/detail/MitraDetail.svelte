<script lang="ts">
  export let mitra: any = null;

  function getKategoriBadgeColor(kategori: string) {
    const base = 'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold';
    switch (kategori) {
      case 'Pribadi':
      case 'Perusahaan':
      case 'Customer':
      case 'Vendor':
        return `${base} bg-indigo-500/15 text-indigo-700 dark:text-indigo-300`;
      default:
        return `${base} bg-slate-500/15 text-slate-700 dark:text-slate-300`;
    }
  }
</script>

{#if mitra}
  <div class="bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm border border-black/5 dark:border-white/10 overflow-hidden">
    <dl class="divide-y divide-black/5 dark:divide-white/10">
      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Nama</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{mitra.nama}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Kategori</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2 space-x-1">
          {#if mitra.is_pribadi}<span class="{getKategoriBadgeColor('Pribadi')}">Pribadi</span>{/if}
          {#if mitra.is_perusahaan}<span class="{getKategoriBadgeColor('Perusahaan')}">Perusahaan</span>{/if}
          {#if mitra.is_customer}<span class="{getKategoriBadgeColor('Customer')}">Customer</span>{/if}
          {#if mitra.is_vendor}<span class="{getKategoriBadgeColor('Vendor')}">Vendor</span>{/if}
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Alamat</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{mitra.alamat}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Website</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{mitra.website || '-'}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Email</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{mitra.email || '-'}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Kontak 1</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if mitra.kontak_1}
            {mitra.kontak_1}<br>
            <span class="text-xs text-slate-500 dark:text-slate-400">Nama: {mitra.kontak_1_nama} | Jabatan: {mitra.kontak_1_jabatan}</span>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Kontak 2</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if mitra.kontak_2}
            {mitra.kontak_2}<br>
            <span class="text-xs text-slate-500 dark:text-slate-400">Nama: {mitra.kontak_2_nama} | Jabatan: {mitra.kontak_2_jabatan}</span>
          {:else}
            -
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
