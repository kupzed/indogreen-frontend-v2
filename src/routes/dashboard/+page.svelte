<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchDashboard, getToken, setToken } from '$lib/api';
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
      const res = await fetchDashboard();
      dashboard = res?.data ?? res; // flexible based on backend shape
    } catch (err: any) {
      errorMessage = err?.message || 'Gagal memuat dashboard';
    } finally {
      loading = false;
    }
  });

  function logout() {
    setToken(null);
    goto('/auth/login');
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-medium text-gray-900">Dashboard</h2>
    <button on:click={logout} class="text-sm text-gray-500 hover:text-gray-700">Keluar</button>
  </div>

  {#if loading}
    <p>Memuat data dashboard...</p>
  {:else if errorMessage}
    <p class="text-red-500">{errorMessage}</p>
  {:else}
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl leading-6 font-medium text-gray-900">Project Terbaru</h2>
        <div class="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          <ul class="divide-y divide-gray-200">
            {#if (dashboard?.latest_projects ?? []).length === 0}
              <li class="px-4 py-4 sm:px-6">
                <p class="text-sm text-gray-500">Belum ada project terbaru.</p>
              </li>
            {:else}
              {#each dashboard.latest_projects as p (p.id)}
                <li class="hover:bg-gray-50">
                  <a href={`/projects/${p.id}`} class="block">
                    <div class="px-4 py-4 sm:px-6">
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-indigo-600 truncate">
                          {p.name}
                        </p>
                        <div class="ml-2 flex-shrink-0 flex">
                          <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                            {p.status}
                          </span>
                          {#if p.is_cert_projects}
                            <span class="ml-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-purple-100 text-purple-800">
                              Certificate
                            </span>
                          {/if}
                        </div>
                      </div>
                      <div class="mt-2 sm:flex sm:justify-between">
                        <div class="sm:flex">
                          <p class="flex items-center text-sm text-gray-500">
                            Customer: {p.mitra?.nama || '-'}
                          </p>
                        </div>
                        <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                          </svg>
                          <p>
                            Mulai: {new Date(p.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
              {/each}
            {/if}
          </ul>
        </div>
      </div>

      <div class="mt-8">
        <h2 class="text-2xl leading-6 font-medium text-gray-900">Aktivitas Terbaru</h2>
        <div class="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          <ul class="divide-y divide-gray-200">
            {#if (dashboard?.latest_activities ?? []).length === 0}
              <li class="px-4 py-4 sm:px-6">
                <p class="text-sm text-gray-500">Belum ada aktivitas terbaru.</p>
              </li>
            {:else}
              {#each dashboard.latest_activities as a (a.id)}
                <li class="hover:bg-gray-50">
                  <a href={`/activities/${a.id}`} class="block">
                    <div class="px-4 py-4 sm:px-6">
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-indigo-600 truncate">
                          {a.name || a.nama || 'Aktivitas'}
                        </p>
                        <div class="ml-2 flex-shrink-0 flex">
                          <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-300 text-gray-900">
                            {a.kategori || 'Aktivitas'}
                          </span>
                        </div>
                      </div>
                      <div class="mt-2 sm:flex sm:justify-between">
                        <div class="sm:flex">
                          <p class="flex items-center text-sm text-gray-500">
                            Project: {a.project?.name || '-'}
                            {#if a.jenis}
                              | Jenis: {a.jenis}
                            {/if}
                          </p>
                        </div>
                        <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                          </svg>
                          <p>
                            {new Date(a.activity_date || a.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
              {/each}
            {/if}
          </ul>
        </div>
      </div>
    </div>
  {/if}
</div>


