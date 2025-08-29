<!-- 
  TEMPLATE: Cara Cepat Implementasi Pagination
  
  File ini adalah template untuk mengimplementasikan pagination di halaman baru.
  Copy-paste kode di bawah ini ke halaman yang membutuhkan pagination.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import axiosClient from '$lib/axiosClient';

  // 1. State pagination (WAJIB)
  let currentPage: number = 1;
  let lastPage: number = 1;
  let totalItems: number = 0;
  let items: any[] = [];
  let loading = false;

  // 2. Fungsi untuk mengambil data (WAJIB)
  async function fetchData() {
    loading = true;
    try {
      const response = await axiosClient.get('/api/your-endpoint', {
        params: { 
          page: currentPage,
          // tambahkan parameter lain sesuai kebutuhan
        }
      });
      
      // Update data dan pagination info
      items = response.data.data;
      currentPage = response.data.pagination.current_page;
      lastPage = response.data.pagination.last_page;
      totalItems = response.data.pagination.total;
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      loading = false;
    }
  }

  // 3. Fungsi untuk navigasi halaman (WAJIB)
  function goToPage(page: number) {
    currentPage = page;
    fetchData(); // Ambil data baru
  }

  // 4. Load data saat komponen mount
  onMount(() => {
    fetchData();
  });
</script>

<!-- 5. Tampilkan data -->
{#if loading}
  <div class="text-center py-8">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    <p class="mt-2 text-gray-600">Loading...</p>
  </div>
{:else if items.length === 0}
  <div class="text-center py-8">
    <p class="text-gray-500">Tidak ada data yang ditemukan.</p>
  </div>
{:else}
  <!-- List atau table items -->
  <div class="space-y-4">
    {#each items as item (item.id)}
      <div class="bg-white p-4 rounded-lg shadow border">
        <!-- Tampilkan data item sesuai kebutuhan -->
        <h3 class="font-medium">{item.name}</h3>
        <p class="text-gray-600">{item.description}</p>
      </div>
    {/each}
  </div>

  <!-- 6. Komponen Pagination (WAJIB) -->
  <Pagination 
    currentPage={currentPage} 
    lastPage={lastPage} 
    onPageChange={goToPage} 
    totalItems={totalItems} 
    itemsPerPage={10} 
  />
{/if}

<!-- 
  CATATAN PENTING:
  
  1. Pastikan backend mengembalikan response dengan format:
     {
       data: [...], // array data
       pagination: {
         current_page: 1,
         last_page: 5,
         total: 50
       }
     }
  
  2. Jika format response berbeda, sesuaikan bagian:
     items = response.data.data;
     currentPage = response.data.pagination.current_page;
     lastPage = response.data.pagination.last_page;
     totalItems = response.data.pagination.total;
  
  3. Jika menggunakan parameter selain 'page', sesuaikan di:
     params: { 
       page: currentPage,
       search: searchTerm,
       filter: filterValue
     }
  
  4. Jangan lupa reset currentPage = 1 saat filter/search berubah
  
  5. Komponen Pagination hanya muncul jika totalItems > 0
-->
