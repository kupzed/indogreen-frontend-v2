<script lang="ts">
  export let barangCertificates: any = null;
</script>

{#if barangCertificates}
  <div class="bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm border border-black/5 dark:border-white/10 overflow-hidden">
    <dl class="divide-y divide-black/5 dark:divide-white/10">
      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Nama</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{barangCertificates.name}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">No. Seri</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">{barangCertificates.no_seri}</dd>
      </div>

      <div class="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt class="text-sm font-medium text-slate-500 dark:text-slate-300">Mitra</dt>
        <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2">
          {#if barangCertificates.mitra}
            <a href={`/mitras/${barangCertificates.mitra.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{barangCertificates.mitra.nama}</a>
          {:else}
            -
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
