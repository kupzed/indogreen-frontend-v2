<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiFetch, getToken } from '$lib/api';
	import Drawer from '$lib/components/Drawer.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import BarangCertificatesDetail from '$lib/components/detail/BarangCertificatesDetail.svelte';
	import MitraDetail from '$lib/components/detail/MitraDetail.svelte';
	import MitraFormModal from '$lib/components/form/MitraFormModal.svelte';
	import BarangCertificateFormModal from '$lib/components/form/BarangCertificateFormModal.svelte';
	import { userPermissions } from '$lib/stores/permissions';

	let mitraId: string | null = null;
	let mitra: any = null;
	let loadingMitra = true;
	let errorMitra = '';
	let showEditModal = false;
	let editingMitra: any = null;

	let form = {
		nama: '',
		is_pribadi: false,
		is_perusahaan: false,
		is_customer: false,
		is_vendor: false,
		alamat: '',
		website: '',
		email: '',
		kontak_1: '',
		kontak_1_nama: '',
		kontak_1_jabatan: '',
		kontak_2: '',
		kontak_2_nama: '',
		kontak_2_jabatan: ''
	};

	const mitraKategoriOptions = ['Pribadi', 'Perusahaan', 'Customer', 'Vendor'];
	let activeTab: 'detail' | 'barang' = 'detail';

	type BarangCertificate = {
		id: number;
		name: string;
		no_seri: string;
		mitra_id: number | '' | null;
		mitra?: { id: number; nama: string } | null;
		created_at?: string;
		updated_at?: string;
	};

	let canUpdateMitra = false;
	let canDeleteMitra = false;
	let canCreateBC = false;
	let canUpdateBC = false;
	let canDeleteBC = false;

	$: {
		const perms = $userPermissions ?? [];
		canUpdateMitra = perms.includes('mitra-update');
		canDeleteMitra = perms.includes('mitra-delete');
		canCreateBC = perms.includes('bc-create');
		canUpdateBC = perms.includes('bc-update');
		canDeleteBC = perms.includes('bc-delete');
	}

	let bcItems: BarangCertificate[] = [];
	let bcLoading = false;
	let bcError = '';
	let bcSearch = '';
	let bcCurrentPage = 1;
	let bcLastPage = 1;
	let bcTotalItems = 0;
	let perPage = 50;
	const perPageOptions = [10, 25, 50, 100];
	let bcInitialized = false;

	let bcSortBy: 'created' = 'created';
	let bcSortDir: 'asc' | 'desc' = 'desc';

	let bcActiveView: 'table' | 'list' = 'table';
	const views: Array<'table' | 'list'> = ['table', 'list'];
	function handleViewKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			let idx = views.indexOf(bcActiveView);
			idx =
				e.key === 'ArrowRight' ? (idx + 1) % views.length : (idx - 1 + views.length) % views.length;
			bcActiveView = views[idx];
		}
	}

	let bcForm: { name: string; no_seri: string; mitra_id: number | '' | null } = {
		name: '',
		no_seri: '',
		mitra_id: ''
	};

	function qs(obj: Record<string, any>) {
		const p = new URLSearchParams();
		Object.entries(obj).forEach(([k, v]) => {
			if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
		});
		return p.toString();
	}

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

	async function fetchMitraDetails() {
		loadingMitra = true;
		errorMitra = '';
		if (!mitraId) {
			errorMitra = 'Mitra ID tidak ditemukan.';
			loadingMitra = false;
			return;
		}
		try {
			const res: any = await apiFetch(`/mitras/${mitraId}`, { auth: true });
			mitra = res?.data ?? res ?? null;
			form = { ...form, ...(mitra || {}) };
			editingMitra = mitra;
		} catch (err: any) {
			errorMitra = err?.message || 'Gagal memuat detail mitra.';
			console.error(err);
		} finally {
			loadingMitra = false;
		}
	}

	function openEditModal() {
		if (!canUpdateMitra) {
			console.warn('Blocked: lacking mitra-update permission');
			return;
		}
		showEditModal = true;
	}

	async function handleSubmitUpdate() {
		if (!mitra?.id) return;
		if (!canUpdateMitra) {
			console.warn('Blocked: lacking mitra-update permission (submit)');
			return;
		}
		try {
			await apiFetch(`/mitras/${mitra.id}`, { method: 'PUT', body: form, auth: true });
			alert('Mitra berhasil diperbarui!');
			goto(`/mitras/${mitra.id}`);
			showEditModal = false;
			fetchMitraDetails();
		} catch (err: any) {
			alert('Error:\n' + (err?.message || 'Gagal memperbarui mitra.'));
		}
	}

	async function handleDelete() {
		if (!mitra?.id) return;
		if (!canDeleteMitra) {
			console.warn('Blocked: lacking mitra-delete permission');
			return;
		}
		if (!confirm('Apakah Anda yakin ingin menghapus mitra ini?')) return;
		try {
			await apiFetch(`/mitras/${mitra.id}`, { method: 'DELETE', auth: true });
			alert('Mitra berhasil dihapus!');
			goto('/mitras');
		} catch (err: any) {
			alert('Gagal menghapus mitra: ' + (err?.message || 'Terjadi kesalahan'));
		}
	}

	async function fetchBarangCertificates() {
		if (!mitra?.id) return;
		bcLoading = true;
		bcError = '';
		try {
			const url = `/barang-certificates?${qs({
				search: bcSearch,
				mitra_id: mitra.id,
				page: bcCurrentPage,
				per_page: perPage,
				sort_by: bcSortBy,
				sort_dir: bcSortDir
			})}`;
			const res: any = await apiFetch(url, { auth: true });
			bcItems = res?.data ?? res?.items ?? res ?? [];
			bcCurrentPage = res?.pagination?.current_page ?? res?.current_page ?? 1;
			bcLastPage = res?.pagination?.last_page ?? res?.last_page ?? 1;
			bcTotalItems =
				res?.pagination?.total ?? res?.total ?? (Array.isArray(bcItems) ? bcItems.length : 0);
		} catch (err: any) {
			bcError = err?.message || 'Gagal memuat data.';
			console.error(err);
		} finally {
			bcLoading = false;
		}
	}

	function bcHandleSortChange() {
		bcCurrentPage = 1;
		fetchBarangCertificates();
	}
	function bcHandleSearchChange() {
		bcCurrentPage = 1;
		fetchBarangCertificates();
	}

	let searchTimer: ReturnType<typeof setTimeout>;

	function bcHandleSearchDebounced() {
		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			bcHandleSearchChange();
		}, 800);
	}

	function bcGoToPage(page: number) {
		if (page > 0 && page <= bcLastPage) {
			bcCurrentPage = page;
			fetchBarangCertificates();
		}
	}

	function bcOpenCreateModal() {
		if (!canCreateBC) {
			console.warn('Blocked: lacking bc-create permission');
			return;
		}
		if (!mitra?.id) return;
		bcForm = { name: '', no_seri: '', mitra_id: mitra.id };
		bcShowCreateModal = true;
	}

	function bcOpenEditModal(item: BarangCertificate) {
		if (!canUpdateBC) {
			console.warn('Blocked: lacking bc-update permission');
			return;
		}
		bcEditingItem = { ...item };
		bcForm = { name: item.name ?? '', no_seri: item.no_seri ?? '', mitra_id: mitra?.id ?? '' };
		bcShowEditModal = true;
	}

	function bcOpenDetailDrawer(item: BarangCertificate) {
		bcSelectedItem = { ...item };
		bcShowDetailDrawer = true;
	}

	async function bcHandleSubmitCreate() {
		if (!canCreateBC) {
			console.warn('Blocked: lacking bc-create permission (submit)');
			return;
		}
		try {
			if (mitra?.id) bcForm.mitra_id = mitra.id;
			await apiFetch('/barang-certificates', { method: 'POST', body: bcForm, auth: true });
			alert('Data berhasil ditambahkan');
			bcShowCreateModal = false;
			fetchBarangCertificates();
		} catch (err: any) {
			alert('Error:\n' + (err?.message || 'Gagal menambahkan data.'));
		}
	}

	async function bcHandleSubmitUpdate() {
		if (!bcEditingItem?.id) return;
		if (!canUpdateBC) {
			console.warn('Blocked: lacking bc-update permission (submit)');
			return;
		}
		try {
			if (mitra?.id) bcForm.mitra_id = mitra.id;
			await apiFetch(`/barang-certificates/${bcEditingItem.id}`, {
				method: 'PUT',
				body: bcForm,
				auth: true
			});
			alert('Data berhasil diperbarui');
			bcShowEditModal = false;
			fetchBarangCertificates();
		} catch (err: any) {
			alert('Error:\n' + (err?.message || 'Gagal memperbarui data.'));
		}
	}

	async function bcHandleDelete(id: number) {
		if (!canDeleteBC) {
			console.warn('Blocked: lacking bc-delete permission');
			return;
		}
		if (!confirm('Yakin ingin menghapus data ini?')) return;
		try {
			await apiFetch(`/barang-certificates/${id}`, { method: 'DELETE', auth: true });
			alert('Data berhasil dihapus');
			fetchBarangCertificates();
		} catch (err: any) {
			alert('Gagal menghapus data: ' + (err?.message || 'Terjadi kesalahan'));
		}
	}

	let bcFilterChips: Array<{ key: 'search' | 'sort'; label: string }> = [];
	$: bcFilterChips = [
		bcSearch && { key: 'search', label: `Cari: ${bcSearch}` },
		bcSortDir === 'asc' && { key: 'sort', label: 'Urut: Create Terlama' }
	].filter(Boolean) as Array<{ key: 'search' | 'sort'; label: string }>;

	function clearOneBcFilter(key: 'search' | 'sort') {
		if (key === 'search') bcSearch = '';
		if (key === 'sort') bcSortDir = 'desc'; // kembali ke default "Create Terbaru"
		bcHandleSearchChange();
	}
	function clearAllBcFilters() {
		bcSearch = '';
		bcSortDir = 'desc';
		bcHandleSearchChange();
	}

	onMount(() => {
		if (!getToken()) {
			goto('/auth/login');
			return;
		}
		mitraId = $page.params.id ?? null;
		fetchMitraDetails();
	});

	$: if (activeTab === 'barang' && mitra?.id && !bcInitialized) {
		bcInitialized = true;
		fetchBarangCertificates();
	}

	let bcShowCreateModal = false;
	let bcShowEditModal = false;
	let bcEditingItem: BarangCertificate | null = null;
	let bcShowDetailDrawer = false;
	let bcSelectedItem: BarangCertificate | null = null;

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

	$: lockBodyScroll(showEditModal || bcShowCreateModal || bcShowEditModal || bcShowDetailDrawer);
</script>

<svelte:head><title>Detail Mitra - Indogreen</title></svelte:head>

{#if loadingMitra}
	<section
		class="flex min-h-[calc(100dvh-60px-48px)] min-w-0 flex-col sm:min-h-[calc(100dvh-72px-48px)]"
		role="status"
		aria-busy="true"
	>
		<div class="py-3">
			<div class="flex items-start justify-between gap-4">
				<div class="min-w-0 flex-1">
					<div class="h-7 w-64 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"></div>
					<div class="my-2 flex flex-wrap gap-3">
						<div class="h-4 w-52 animate-pulse rounded-md bg-slate-200/60 dark:bg-white/10"></div>
					</div>
				</div>
				<div class="flex shrink-0 flex-col gap-2 sm:flex-row">
					<div class="h-9 w-24 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"></div>
					<div class="h-9 w-24 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"></div>
				</div>
			</div>
		</div>
		<div class="py-3">
			<div
				class="inline-flex border border-black/5 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5"
			>
				<div class="h-8 w-20 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/10"></div>
				<div class="ml-1 h-8 w-24 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/10"></div>
			</div>
		</div>
		<div
			class="border border-black/5 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#12101d]/60"
		>
			<div class="h-5 w-40 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"></div>
			<div class="mt-4 space-y-3">
				{#each Array(7) as _}
					<div class="h-10 animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/5"></div>
				{/each}
			</div>
		</div>
	</section>
{:else if errorMitra}
	<p class="text-rose-500">{errorMitra}</p>
{:else if mitra}
	<div class="mx-auto mb-8">
		<section
			class="flex min-h-[calc(100dvh-60px-48px)] min-w-0 flex-col sm:min-h-[calc(100dvh-72px-48px)]"
		>
			<div>
				<div class="py-3">
					<div class="flex items-start justify-between gap-4">
						<div class="min-w-0 flex-1">
							<h2 class="text-2xl leading-7 font-bold text-slate-900 dark:text-slate-100">
								{mitra.nama}
							</h2>
							<div class="my-2 flex flex-wrap gap-2">
								{#if mitra.is_pribadi}<span class={getKategoriBadgeColor('Pribadi')}>Pribadi</span
									>{/if}
								{#if mitra.is_perusahaan}<span class={getKategoriBadgeColor('Perusahaan')}
										>Perusahaan</span
									>{/if}
								{#if mitra.is_customer}<span class={getKategoriBadgeColor('Customer')}
										>Customer</span
									>{/if}
								{#if mitra.is_vendor}<span class={getKategoriBadgeColor('Vendor')}>Vendor</span
									>{/if}
							</div>
						</div>
						<div class="flex shrink-0 flex-col gap-2 sm:flex-row">
							{#if canUpdateMitra}
								<button
									on:click={openEditModal}
									class="h-9 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
									>Edit Mitra</button
								>
							{/if}
							{#if canDeleteMitra}
								<button
									on:click={handleDelete}
									class="h-9 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
									>Hapus Mitra</button
								>
							{/if}
						</div>
					</div>
				</div>

				<div class="py-3">
					<div
						class="inline-flex rounded-2xl border border-black/5 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5"
						role="tablist"
						aria-label="Mitra tabs"
					>
						<button
							on:click={() => (activeTab = 'detail')}
							class="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition dark:text-slate-300"
							class:bg-white={activeTab === 'detail'}
							class:dark:bg-violet-900={activeTab === 'detail'}
							class:text-violet-800={activeTab === 'detail'}
							class:dark:text-white={activeTab === 'detail'}>Detail</button
						>
						<button
							on:click={() => (activeTab = 'barang')}
							class="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition dark:text-slate-300"
							class:bg-white={activeTab === 'barang'}
							class:dark:bg-violet-900={activeTab === 'barang'}
							class:text-violet-800={activeTab === 'barang'}
							class:dark:text-white={activeTab === 'barang'}>Barang Sertifikat</button
						>
					</div>
				</div>

				{#if activeTab === 'detail'}
					<div
						class="mb-8 overflow-hidden border border-black/5 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0e0c19]/90"
					>
						<div
							class="border-b border-black/5 bg-white/70 px-4 py-5 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-[#12101d]/70"
						>
							<h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
								Informasi Mitra
							</h3>
						</div>
						<div class="px-4 py-3 sm:px-6">
							<MitraDetail {mitra} />
						</div>
					</div>
				{/if}

				{#if activeTab === 'barang'}
					<section
						class="flex min-h-[calc(100dvh-60px-48px)] min-w-0 flex-col sm:min-h-[calc(100dvh-72px-48px)]"
					>
						<div
							class="sticky top-[60px] z-30 divide-y divide-black/5 border border-black/5 sm:top-[72px] dark:divide-white/10 dark:border-white/10"
						>
							<div
								class="flex flex-nowrap items-center gap-2 bg-white/70 px-2 py-2 backdrop-blur dark:bg-[#12101d]/70"
							>
								<div class="flex shrink-0 items-center gap-2">
									<label class="sr-only" for="bc-sort">Sortir</label>
									<select
										id="bc-sort"
										bind:value={bcSortDir}
										on:change={bcHandleSortChange}
										class="h-9 shrink-0 rounded-md border border-black/5 bg-white/70 px-3
                          text-sm text-slate-800 dark:border-white/10 dark:bg-[#12101d]/70 dark:text-slate-100"
										aria-label="Sortir berdasarkan tanggal buat"
										title="Sortir berdasarkan tanggal buat"
									>
										<option value="desc">Terbaru</option>
										<option value="asc">Terlama</option>
									</select>
									<div
										class="inline-flex rounded-md border border-black/5 bg-slate-100/70 dark:border-white/10 dark:bg-white/5"
										role="tablist"
										aria-label="Switch view"
										tabindex="0"
										on:keydown={handleViewKeydown}
									>
										<button
											on:click={() => (bcActiveView = 'table')}
											class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
											class:bg-white={bcActiveView === 'table'}
											class:dark:bg-[#12101d]={bcActiveView === 'table'}
											class:shadow={bcActiveView === 'table'}
											title="Table"
										>
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
												stroke-linecap="round"
												stroke-linejoin="round"
												width="18"
												height="18"
											>
												<rect x="3.5" y="4.5" width="17" height="15" rx="2" />
												<line x1="3.5" y1="9" x2="20.5" y2="9" />
												<line x1="3.5" y1="13" x2="20.5" y2="13" />
												<line x1="3.5" y1="17" x2="20.5" y2="17" />
											</svg>
											<span class="sr-only">Tampilan Tabel</span>
										</button>
										<button
											on:click={() => (bcActiveView = 'list')}
											class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
											class:bg-white={bcActiveView === 'list'}
											class:dark:bg-[#12101d]={bcActiveView === 'list'}
											class:shadow={bcActiveView === 'list'}
											title="List"
										>
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
												stroke-linecap="round"
												stroke-linejoin="round"
												width="18"
												height="18"
											>
												<circle cx="5" cy="6" r="1.3" />
												<circle cx="5" cy="12" r="1.3" />
												<circle cx="5" cy="18" r="1.3" />
												<line x1="9" y1="6" x2="20" y2="6" />
												<line x1="9" y1="12" x2="20" y2="12" />
												<line x1="9" y1="18" x2="20" y2="18" />
											</svg>
											<span class="sr-only">Tampilan List</span>
										</button>
									</div>
								</div>
								<div class="flex min-w-0 flex-1 items-center gap-2">
									<div class="relative min-w-0 flex-1">
										<div
											class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
										>
											<svg class="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
												<path
													fill-rule="evenodd"
													d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
													clip-rule="evenodd"
												/>
											</svg>
										</div>
										<input
											type="text"
											placeholder="Cari barang certificate..."
											bind:value={bcSearch}
											on:input={bcHandleSearchDebounced}
											class="block h-9 w-full rounded-md border border-black/5 bg-white/70 pr-3 pl-10 text-sm text-slate-800 placeholder-slate-500 focus:ring-1 focus:ring-violet-500 focus:outline-none dark:border-white/10 dark:bg-[#12101d]/70 dark:text-slate-100 dark:placeholder-slate-400"
										/>
									</div>
									{#if canCreateBC}
										<button
											on:click={bcOpenCreateModal}
											class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-violet-600 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-violet-700 active:scale-95"
											aria-label="Tambah Barang"
											title="Tambah Barang"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="2"
												stroke="currentColor"
												class="h-5 w-5"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 4.5v15m7.5-7.5h-15"
												/>
											</svg>
										</button>
									{/if}
								</div>
							</div>

							{#if bcFilterChips.length}
								<div
									class="flex flex-wrap items-center gap-2 bg-white/70 px-3 py-2 backdrop-blur dark:bg-[#12101d]/70"
								>
									{#each bcFilterChips as chip}
										<span
											class="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs font-medium dark:border-white/10 dark:bg-[#12101d]/70"
										>
											{chip.label}
											<button
												type="button"
												aria-label="Hapus filter"
												class="opacity-70 hover:opacity-100"
												on:click={() => clearOneBcFilter(chip.key)}>✕</button
											>
										</span>
									{/each}
									<button
										type="button"
										class="text-xs font-medium text-violet-700 hover:underline dark:text-violet-300"
										on:click={clearAllBcFilters}>Clear</button
									>
								</div>
							{/if}
						</div>

						<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
							<div class="mt-4">
								{#if bcLoading}
									{#if bcActiveView === 'table'}
										<div
											class="bg-white/70 px-4 shadow-sm backdrop-blur dark:bg-[#12101d]/70"
											role="status"
											aria-busy="true"
										>
											<div class="no-scrollbar overflow-x-auto">
												<table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
													<thead class="bg-transparent">
														<tr>
															{#each ['Nama Barang', 'No. Seri', 'Mitra', 'Aksi'] as _}
																<th class="px-3 py-3.5 text-left">
																	<div
																		class="h-4 w-28 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
																	></div>
																</th>
															{/each}
														</tr>
													</thead>
													<tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
														{#each Array(Math.min(perPage || 10, 10)) as _}
															<tr class="animate-pulse">
																<td class="px-3 py-4">
																	<div
																		class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"
																	></div>
																	<div
																		class="mt-2 h-3 w-40 rounded-md bg-slate-200/50 dark:bg-white/5"
																	></div>
																</td>
																<td class="px-3 py-4"
																	><div
																		class="h-4 w-40 rounded-md bg-slate-200/70 dark:bg-white/5"
																	></div></td
																>
																<td class="px-3 py-4"
																	><div
																		class="h-4 w-44 rounded-md bg-slate-200/70 dark:bg-white/5"
																	></div></td
																>
																<td class="px-3 py-4">
																	<div class="flex items-center gap-3">
																		<div
																			class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"
																		></div>
																		<div
																			class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"
																		></div>
																		<div
																			class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"
																		></div>
																	</div>
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
											<div class="border-t border-slate-200/70 px-3 py-3.5 dark:border-white/10">
												<div class="flex items-center justify-between">
													<div
														class="h-4 w-48 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
													></div>
													<div class="flex items-center gap-2">
														<div
															class="h-9 w-24 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5"
														></div>
														<div
															class="h-9 w-9 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5"
														></div>
														<div
															class="h-9 w-9 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5"
														></div>
													</div>
												</div>
											</div>
										</div>
									{:else}
										<div
											class="mt-4 border border-black/5 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
											role="status"
											aria-busy="true"
										>
											<ul class="divide-y divide-slate-200/70 dark:divide-white/10">
												{#each Array(6) as _}
													<li class="animate-pulse px-4 py-4 sm:px-6">
														<div class="flex items-center justify-between gap-4">
															<div
																class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/5"
															></div>
															<div
																class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"
															></div>
														</div>
														<div class="mt-2 flex flex-wrap items-center justify-between gap-3">
															<div
																class="h-4 w-72 rounded-md bg-slate-200/60 dark:bg-white/5"
															></div>
															<div
																class="h-4 w-40 rounded-md bg-slate-200/60 dark:bg-white/5"
															></div>
														</div>
														<div class="mt-3 flex justify-end gap-2">
															<div
																class="h-7 w-16 rounded-lg bg-slate-200/70 dark:bg-white/5"
															></div>
															<div
																class="h-7 w-14 rounded-lg bg-slate-200/70 dark:bg-white/5"
															></div>
															<div
																class="h-7 w-14 rounded-lg bg-slate-200/70 dark:bg-white/5"
															></div>
														</div>
													</li>
												{/each}
											</ul>
											<div class="border-t border-slate-200/70 px-3 py-3.5 dark:border-white/10">
												<div class="flex items-center justify-between">
													<div
														class="h-4 w-48 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
													></div>
													<div class="flex items-center gap-2">
														<div
															class="h-9 w-24 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5"
														></div>
														<div
															class="h-9 w-9 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5"
														></div>
														<div
															class="h-9 w-9 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5"
														></div>
													</div>
												</div>
											</div>
										</div>
									{/if}
								{:else if bcError}
									<p class="mt-4 text-rose-500">{bcError}</p>
								{:else if bcItems.length === 0}
									<div
										class="mt-4 border border-black/5 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
									>
										<p class="text-sm text-slate-600 dark:text-slate-300">
											Belum ada barang certificate untuk mitra ini.
										</p>
									</div>
								{:else}
									{#if bcActiveView === 'list'}
										<div
											class="mt-4 rounded-2xl border border-black/5 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
										>
											<ul class="divide-y divide-slate-200/70 dark:divide-white/10">
												{#each bcItems as item (item.id)}
													<li>
														<a
															href={`/barang-certificates/${item.id}`}
															class="block px-4 py-4 hover:bg-violet-600/5 sm:px-6 dark:hover:bg-white/5"
															on:click|preventDefault={() => bcOpenDetailDrawer(item)}
															on:keydown={(e) => {
																if (e.key === 'Enter' || e.key === ' ') {
																	e.preventDefault();
																	bcOpenDetailDrawer(item);
																}
															}}
															role="button"
															aria-label={`Lihat detail barang certificate ${item.name}`}
														>
															<div class="flex items-center justify-between gap-4">
																<p
																	class="truncate text-sm font-medium text-violet-700 dark:text-violet-300"
																>
																	{item.name}
																</p>
																<p
																	class="text-xs whitespace-nowrap text-slate-500 dark:text-slate-400"
																>
																	No. Seri: {item.no_seri}
																</p>
															</div>
															<div class="mt-2 gap-3 sm:flex sm:items-center sm:justify-between">
																<p class="text-sm text-slate-600 dark:text-slate-300">
																	Mitra: {mitra.nama}
																</p>
															</div>
														</a>
														<div class="flex justify-end gap-2 px-4 py-2 sm:px-6">
															<button
																on:click|stopPropagation={() => bcOpenDetailDrawer(item)}
																class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
																>Detail</button
															>
															{#if canUpdateBC}
																<button
																	on:click|stopPropagation={() => bcOpenEditModal(item)}
																	class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
																	>Edit</button
																>
															{/if}
															{#if canDeleteBC}
																<button
																	on:click|stopPropagation={() => bcHandleDelete(item.id)}
																	class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
																	>Hapus</button
																>
															{/if}
														</div>
													</li>
												{/each}
											</ul>
											{#if bcItems.length > 0}
												<Pagination
													currentPage={bcCurrentPage}
													lastPage={bcLastPage}
													onPageChange={bcGoToPage}
													totalItems={bcTotalItems}
													itemsPerPage={perPage}
													{perPageOptions}
													onPerPageChange={(n) => {
														perPage = n;
														bcCurrentPage = 1;
														fetchBarangCertificates();
													}}
												/>
											{/if}
										</div>
									{/if}

									{#if bcActiveView === 'table'}
										<div class="bg-white/70 px-4 shadow-sm backdrop-blur dark:bg-[#12101d]/70">
											<div class="no-scrollbar relative overflow-x-auto">
												<table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
													<thead>
														<tr>
															<th
																class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
																>Nama Barang</th
															>
															<th
																class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
																>No. Seri</th
															>
															<th
																class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
																>Mitra</th
															>
															<th
																class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
																>Aksi</th
															>
														</tr>
													</thead>
													<tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
														{#each bcItems as item (item.id)}
															<tr>
																<td
																	class="px-3 py-4 text-sm font-medium whitespace-nowrap text-slate-900 dark:text-slate-100"
																>
																	<a
																		href={`/barang-certificates/${item.id}`}
																		class="text-violet-700 hover:underline dark:text-violet-300"
																		on:click|preventDefault={() => bcOpenDetailDrawer(item)}
																		on:keydown={(e) => {
																			if (e.key === 'Enter' || e.key === ' ') {
																				e.preventDefault();
																				bcOpenDetailDrawer(item);
																			}
																		}}
																		role="button"
																		aria-label={`Lihat detail barang certificate ${item.name}`}
																	>
																		{item.name}
																	</a>
																</td>
																<td
																	class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
																	>{item.no_seri}</td
																>
																<td
																	class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
																	>{mitra.nama}</td
																>
																<td class="px-3 py-4 text-sm whitespace-nowrap">
																	<div class="flex items-center gap-2">
																		<button
																			on:click={() => bcOpenDetailDrawer(item)}
																			class="text-amber-600 hover:text-amber-700"
																			title="Detail"
																		>
																			<svg
																				xmlns="http://www.w3.org/2000/svg"
																				width="20"
																				height="20"
																				viewBox="0 0 24 24"
																				fill="none"
																				stroke="currentColor"
																				stroke-width="2"
																			>
																				<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
																				<circle cx="12" cy="12" r="3" />
																			</svg>
																			<span class="sr-only">Detail, {item.name}</span>
																		</button>
																		{#if canUpdateBC}
																			<button
																				on:click={() => bcOpenEditModal(item)}
																				class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
																				title="Edit"
																			>
																				<svg
																					class="h-5 w-5"
																					viewBox="0 0 24 24"
																					fill="none"
																					stroke="currentColor"
																				>
																					<path
																						stroke-linecap="round"
																						stroke-linejoin="round"
																						stroke-width="2"
																						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
																					/>
																				</svg>
																				<span class="sr-only">Edit, {item.name}</span>
																			</button>
																		{/if}
																		{#if canDeleteBC}
																			<button
																				on:click={() => bcHandleDelete(item.id)}
																				class="text-rose-600 hover:text-rose-700"
																				title="Hapus"
																			>
																				<svg
																					xmlns="http://www.w3.org/2000/svg"
																					width="20"
																					height="20"
																					viewBox="0 0 24 24"
																					fill="none"
																					stroke="currentColor"
																					stroke-width="2"
																				>
																					<polyline points="3 6 5 6 21 6" />
																					<path
																						d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
																					/>
																					<line x1="10" y1="11" x2="10" y2="17" />
																					<line x1="14" y1="11" x2="14" y2="17" />
																				</svg>
																				<span class="sr-only">Hapus, {item.name}</span>
																			</button>
																		{/if}
																	</div>
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
											{#if bcItems.length > 0}
												<Pagination
													currentPage={bcCurrentPage}
													lastPage={bcLastPage}
													onPageChange={bcGoToPage}
													totalItems={bcTotalItems}
													itemsPerPage={perPage}
													{perPageOptions}
													onPerPageChange={(n) => {
														perPage = n;
														bcCurrentPage = 1;
														fetchBarangCertificates();
													}}
												/>
											{/if}
										</div>
									{/if}
								{/if}
							</div>
						</div>
					</section>
				{/if}
			</div>
		</section>

		<MitraFormModal
			bind:show={showEditModal}
			title="Edit Mitra"
			submitLabel="Update Mitra"
			idPrefix="edit_mitra"
			{form}
			onSubmit={handleSubmitUpdate}
		/>

		<BarangCertificateFormModal
			bind:show={bcShowCreateModal}
			title="Tambah Barang Certificate"
			submitLabel="Simpan"
			idPrefix="bc_create"
			form={bcForm}
			showMitra={false}
			onSubmit={bcHandleSubmitCreate}
		/>

		<BarangCertificateFormModal
			bind:show={bcShowEditModal}
			title="Edit Barang Certificate"
			submitLabel="Update"
			idPrefix="bc_edit"
			form={bcForm}
			showMitra={false}
			onSubmit={bcHandleSubmitUpdate}
		/>

		<Drawer
			bind:show={bcShowDetailDrawer}
			title="Detail Barang Certificate"
			on:close={() => (bcShowDetailDrawer = false)}
		>
			<BarangCertificatesDetail barangCertificates={bcSelectedItem} />
		</Drawer>
	</div>
{/if}
