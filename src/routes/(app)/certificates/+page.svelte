<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiFetch, getToken } from '$lib/api';

	import Pagination from '$lib/components/Pagination.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import CertificateDetail from '$lib/components/detail/CertificatesDetail.svelte';
	import CertificateFormModal from '$lib/components/form/CertificateFormModal.svelte';

	import CertificateFilterDesktop from '$lib/components/filters/CertificateFilterDesktop.svelte';
	import CertificateFilterMobile from '$lib/components/filters/CertificateFilterMobile.svelte';
	import { userPermissions } from '$lib/stores/permissions';

	// ===== Types =====
	type Option = { id: number; name?: string; nama?: string; title?: string; no_seri?: string };
	type AttachmentItem = {
		id: number;
		name: string;
		description?: string;
		original_name?: string;
		url: string;
		size?: number;
	};

	type Certificate = {
		id: number;
		name: string;
		no_certificate: string;
		project_id: number | '' | null;
		barang_certificate_id: number | '' | null;
		status: string;
		date_of_issue: string;
		date_of_expired: string;
		project?: { id: number; name: string } | null;
		barang_certificate?: { id: number; name: string } | null;
		attachments?: AttachmentItem[];
	};

	let statusOptions: string[] = [];

	// ===== PERMISSIONS =====
	let canCreateCertificate = false;
	let canUpdateCertificate = false;
	let canDeleteCertificate = false;
	$: {
		const perms = $userPermissions ?? [];
		canCreateCertificate = perms.includes('certificate-create');
		canUpdateCertificate = perms.includes('certificate-update');
		canDeleteCertificate = perms.includes('certificate-delete');
	}

	// ===== Data =====
	let items: Certificate[] = [];
	let projects: Option[] = [];
	let barangCertificates: Option[] = [];
	let filteredBarangCertificates: Option[] = [];

	let loading = true;
	let error = '';

	// ===== Filter / Query State =====
	let search = '';
	let statusFilter: '' | Certificate['status'] = '';
	let dateFromFilter = '';
	let dateToFilter = '';
	let sortBy: 'created' | 'date_of_issue' | 'date_of_expired' = 'created';
	let sortDir: 'desc' | 'asc' = 'desc';
	let dateSortField: 'date_of_issue' | 'date_of_expired' = 'date_of_issue';

	// ===== UI State =====
	let activeView: 'table' | 'list' = 'table';
	const views: Array<'table' | 'list'> = ['table', 'list'];
	function handleViewKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			let idx = views.indexOf(activeView);
			idx =
				e.key === 'ArrowRight' ? (idx + 1) % views.length : (idx - 1 + views.length) % views.length;
			activeView = views[idx];
		}
	}

	// sidebar & mobile modal
	let showSidebar = true;
	let showMobileFilter = false;

	// modal & drawer
	let showCreateModal = false;
	let showEditModal = false;
	let editingItem: Certificate | null = null;

	let showDetailDrawer = false;
	let selectedItem: Certificate | null = null;

	// pagination
	let currentPage = 1;
	let lastPage = 1;
	let totalItems = 0;
	let perPage = 50;
	const perPageOptions = [10, 25, 50, 100];

	// ===== FORM (multi-file) =====
	let form: {
		name: string;
		no_certificate: string;
		project_id: number | '' | null;
		barang_certificate_id: number | '' | null;
		status: Certificate['status'] | '';
		date_of_issue: string;
		date_of_expired: string;
		attachments: File[];
		attachment_names: string[];
		attachment_descriptions: string[];
		existing_attachments: AttachmentItem[];
		removed_existing_ids: number[];
	} = {
		name: '',
		no_certificate: '',
		project_id: '',
		barang_certificate_id: '',
		status: '',
		date_of_issue: '',
		date_of_expired: '',
		attachments: [],
		attachment_names: [],
		attachment_descriptions: [],
		existing_attachments: [],
		removed_existing_ids: []
	};

	// ===== Helpers =====
	function qs(obj: Record<string, any>) {
		const p = new URLSearchParams();
		Object.entries(obj).forEach(([k, v]) => {
			if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
		});
		return p.toString();
	}

	// chips (active filters)
	$: activeFilterChips = [
		statusFilter ? { key: 'status' as const, label: statusFilter } : null,
		dateFromFilter || dateToFilter
			? {
					key: 'date' as const,
					label:
						dateFromFilter && dateToFilter
							? `${new Date(dateFromFilter).toLocaleDateString('id-ID')} - ${new Date(dateToFilter).toLocaleDateString('id-ID')}`
							: dateFromFilter
								? `Dari ${new Date(dateFromFilter).toLocaleDateString('id-ID')}`
								: `Sampai ${new Date(dateToFilter).toLocaleDateString('id-ID')}`
				}
			: null,
		sortBy !== 'created' || (sortBy === 'created' && sortDir === 'asc')
			? {
					key: 'sort' as const,
					label:
						sortBy === 'created'
							? `Urut: Create ${sortDir === 'desc' ? 'Terbaru' : 'Terlama'}`
							: `Urut: ${sortBy === 'date_of_issue' ? 'Tanggal Terbit' : 'Tanggal Expired'} ${sortDir === 'desc' ? 'Terbaru dulu' : 'Terlama dulu'}`
				}
			: null,
		search && { key: 'search', label: `Cari: ${search}` }
	].filter(Boolean) as Array<{ key: 'status' | 'date' | 'sort' | 'search'; label: string }>;

	// ===== API =====
	async function fetchDependencies() {
		try {
			const res: any = await apiFetch('/certificate/getFormDependencies', { auth: true });
			projects = res?.data?.projects ?? res?.projects ?? [];
			barangCertificates = res?.data?.barang_certificates ?? res?.barang_certificates ?? [];
			statusOptions = res?.data?.statuses ?? res?.statuses ?? [];
			filteredBarangCertificates = [];
		} catch (err) {
			console.error('Failed to fetch dependencies:', err);
		}
	}

	async function fetchBarangCertificatesByProject(projectId: number) {
		if (!projectId) {
			filteredBarangCertificates = [];
			return;
		}
		try {
			const res: any = await apiFetch(`/certificate/getBarangCertificatesByProject/${projectId}`, {
				auth: true
			});
			filteredBarangCertificates = res?.data ?? res ?? [];
		} catch (err) {
			console.error('Failed to fetch barang certificates by project:', err);
			filteredBarangCertificates = [];
		}
	}

	async function fetchList() {
		loading = true;
		error = '';
		try {
			const url = `/certificates?${qs({
				search,
				status: statusFilter,
				date_from: dateFromFilter,
				date_to: dateToFilter,
				page: currentPage,
				per_page: perPage,
				sort_by: sortBy,
				sort_dir: sortDir
			})}`;
			const res: any = await apiFetch(url, { auth: true });
			items = res?.data ?? res?.items ?? res ?? [];
			currentPage = res?.pagination?.current_page ?? res?.current_page ?? 1;
			lastPage = res?.pagination?.last_page ?? res?.last_page ?? 1;
			totalItems =
				res?.pagination?.total ?? res?.total ?? (Array.isArray(items) ? items.length : 0);
		} catch (err: any) {
			error = err?.message || 'Gagal memuat data.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!getToken()) {
			goto('/auth/login');
			return;
		}
		fetchDependencies();
		fetchList();
	});

	// ===== Filter handlers =====
	function handleFilterOrSearch() {
		currentPage = 1;
		fetchList();
	}

	let searchTimer: ReturnType<typeof setTimeout>;

	function handleSearchDebounced() {
		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			handleFilterOrSearch();
		}, 800);
	}

	function clearFilters() {
		search = '';
		statusFilter = '';
		dateFromFilter = '';
		dateToFilter = '';
		sortBy = 'created';
		sortDir = 'desc';
		dateSortField = 'date_of_issue';
		search = '';
		currentPage = 1;
		fetchList();
	}

	function clearOneFilter(key: 'status' | 'date' | 'sort' | 'search') {
		if (key === 'status') statusFilter = '';
		if (key === 'date') {
			dateFromFilter = '';
			dateToFilter = '';
		}
		if (key === 'sort') {
			sortBy = 'created';
			sortDir = 'desc';
			dateSortField = 'date_of_issue';
		}
		if (key === 'search') search = '';
		handleFilterOrSearch();
	}
	function toggleFilter() {
		if (typeof window !== 'undefined' && window.innerWidth < 1024) {
			showMobileFilter = true;
		} else {
			showSidebar = !showSidebar;
		}
	}

	// ===== Pagination =====
	function goToPage(page: number) {
		if (page > 0 && page <= lastPage) {
			currentPage = page;
			fetchList();
		}
	}

	// ===== Form & Drawer =====
	function openCreateModal() {
		if (!canCreateCertificate) {
			console.warn('Blocked: lacking certificate-create permission');
			return;
		}
		form = {
			name: '',
			no_certificate: '',
			project_id: '',
			barang_certificate_id: '',
			status: '',
			date_of_issue: '',
			date_of_expired: '',
			attachments: [],
			attachment_names: [],
			attachment_descriptions: [],
			existing_attachments: [],
			removed_existing_ids: []
		};
		filteredBarangCertificates = [];
		showCreateModal = true;
	}
	function openEditModal(item: Certificate) {
		if (!canUpdateCertificate) {
			console.warn('Blocked: lacking certificate-update permission');
			return;
		}
		editingItem = { ...item };
		form = {
			name: item.name ?? '',
			no_certificate: item.no_certificate ?? '',
			project_id: item.project_id ?? '',
			barang_certificate_id: item.barang_certificate_id ?? '',
			status: item.status ?? '',
			date_of_issue: item.date_of_issue
				? new Date(item.date_of_issue).toISOString().split('T')[0]
				: '',
			date_of_expired: item.date_of_expired
				? new Date(item.date_of_expired).toISOString().split('T')[0]
				: '',
			attachments: [],
			attachment_names: [],
			attachment_descriptions: [],
			existing_attachments: Array.isArray(item.attachments)
				? item.attachments.map((a) => ({
						id: a.id,
						name: a.name ?? 'Lampiran',
						description: (a as any).description ?? '',
						original_name: (a as any).original_name ?? a.name ?? '',
						url: a.url,
						size: a.size
					}))
				: [],
			removed_existing_ids: []
		};
		if (item.project_id) fetchBarangCertificatesByProject(Number(item.project_id));
		else filteredBarangCertificates = [];
		showEditModal = true;
	}
	function openDetailDrawer(item: Certificate) {
		selectedItem = { ...item };
		showDetailDrawer = true;
	}

	function appendScalar(fd: FormData, key: string, val: any) {
		if (val === null || val === undefined || val === '') return;
		fd.append(key, String(val));
	}
	function buildFormData() {
		const fd = new FormData();
		appendScalar(fd, 'name', form.name);
		appendScalar(fd, 'no_certificate', form.no_certificate);
		appendScalar(fd, 'project_id', form.project_id);
		appendScalar(fd, 'barang_certificate_id', form.barang_certificate_id);
		appendScalar(fd, 'status', form.status);
		appendScalar(fd, 'date_of_issue', form.date_of_issue);
		appendScalar(fd, 'date_of_expired', form.date_of_expired);
		(form.attachments || []).forEach((file, i) => fd.append(`attachments[${i}]`, file));
		(form.attachment_names || []).forEach((n, i) => {
			if (n != null) fd.append(`attachment_names[${i}]`, n);
		});
		(form.attachment_descriptions || []).forEach((d, i) => {
			if (d != null) fd.append(`attachment_descriptions[${i}]`, d);
		});
		(form.existing_attachments || []).forEach((att, i) => {
			fd.append(`existing_attachment_ids[${i}]`, String(att.id));
			fd.append(`existing_attachment_names[${i}]`, att.name);
			fd.append(`existing_attachment_descriptions[${i}]`, att.description ?? '');
		});
		(form.removed_existing_ids || []).forEach((id) =>
			fd.append('removed_existing_ids[]', String(id))
		);
		return fd;
	}

	async function handleSubmitCreate() {
		if (!canCreateCertificate) {
			console.warn('Blocked: lacking certificate-create permission (submit)');
			return;
		}
		try {
			const fd = buildFormData();
			await apiFetch('/certificates', { method: 'POST', body: fd, auth: true });
			alert('Data berhasil ditambahkan');
			showCreateModal = false;
			fetchList();
		} catch (err: any) {
			const msg = err?.message || 'Gagal menambahkan data.';
			alert('Error:\n' + msg);
		}
	}
	async function handleSubmitUpdate() {
		if (!editingItem?.id) return;
		if (!canUpdateCertificate) {
			console.warn('Blocked: lacking certificate-update permission (submit)');
			return;
		}
		try {
			const fd = buildFormData();
			fd.append('_method', 'PUT');
			await apiFetch(`/certificates/${editingItem.id}`, { method: 'POST', body: fd, auth: true });
			alert('Data berhasil diperbarui');
			showEditModal = false;
			fetchList();
		} catch (err: any) {
			const msg = err?.message || 'Gagal memperbarui data.';
			alert('Error:\n' + msg);
		}
	}
	async function handleDelete(id: number) {
		if (!canDeleteCertificate) {
			console.warn('Blocked: lacking certificate-delete permission');
			return;
		}
		if (!confirm('Yakin ingin menghapus data ini?')) return;
		try {
			await apiFetch(`/certificates/${id}`, { method: 'DELETE', auth: true });
			alert('Data berhasil dihapus');
			fetchList();
		} catch (err: any) {
			alert('Gagal menghapus data: ' + (err?.message || 'Terjadi kesalahan'));
		}
	}

	// --- kunci scroll saat drawer/filter/modal terbuka ---
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
	$: lockBodyScroll(showMobileFilter || showDetailDrawer || showCreateModal || showEditModal);

	function getStatusBadgeClasses(status: string) {
		switch (status) {
			case 'Aktif':
				return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300';
			case 'Tidak Aktif':
				return 'bg-rose-500/20 text-rose-600 dark:text-rose-300';
			case 'Belum':
				return 'bg-amber-500/20 text-amber-600 dark:text-amber-300';
			default:
				return 'bg-slate-500/20 text-slate-600 dark:text-slate-300';
		}
	}
</script>

<svelte:head><title>Daftar Sertifikat - Indogreen</title></svelte:head>

<!-- ===== GRID 2 KOLOM ===== -->
<div class={'grid grid-cols-1 gap-4 ' + (showSidebar ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : '')}>
	<!-- SIDEBAR (desktop) -->
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<aside
		role="complementary"
		aria-label="Filter"
		class={'hidden ' + (showSidebar ? 'lg:block' : 'lg:hidden')}
	>
		<div class="sticky top-[72px]">
			<div
				class="no-scrollbar max-h-[calc(100dvh-72px-48px)] overflow-y-auto overscroll-contain [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]"
			>
				<CertificateFilterDesktop
					statusOptions={statusOptions as unknown as string[]}
					statusValue={statusFilter}
					dateFrom={dateFromFilter}
					dateTo={dateToFilter}
					{sortBy}
					{sortDir}
					{dateSortField}
					on:update={(e) => {
						const { key, value } = e.detail as {
							key: 'status' | 'dateFrom' | 'dateTo' | 'sortBy' | 'sortDir' | 'dateSortField';
							value: any;
						};
						if (key === 'status') statusFilter = value as typeof statusFilter;
						if (key === 'dateFrom') dateFromFilter = value as string;
						if (key === 'dateTo') dateToFilter = value as string;
						if (key === 'sortBy') sortBy = value as typeof sortBy;
						if (key === 'sortDir') sortDir = value as typeof sortDir;
						if (key === 'dateSortField') {
							dateSortField = value as typeof dateSortField;
							// jika sedang sorting by date, pindahkan field saat user ganti pilihan
							if (sortBy !== 'created') sortBy = dateSortField;
						}
						handleFilterOrSearch();
					}}
					on:clear={() => clearFilters()}
				/>
			</div>
		</div>
	</aside>

	<!-- KANAN: KONTEN -->
	<section
		class="flex min-h-[calc(100dvh-60px-48px)] min-w-0 flex-col sm:min-h-[calc(100dvh-72px-48px)]"
	>
		<!-- STICKY ACTION BAR + CHIPS -->
		<div
			class="sticky top-[60px] z-30 divide-y divide-black/5 border border-black/5 sm:top-[72px] dark:divide-white/10 dark:border-white/10"
		>
			<!-- ACTION BAR -->
			<div
				class="flex flex-nowrap items-center gap-2 bg-white/70 px-2 py-2 backdrop-blur dark:bg-[#12101d]/70"
			>
				<!-- kiri: filter + view toggle -->
				<div class="flex shrink-0 items-center gap-2">
					<button
						type="button"
						on:click={toggleFilter}
						class="inline-flex h-9 w-9 items-center justify-center rounded-md border
                   border-black/5 bg-white/70 text-sm text-slate-800 transition-colors
                   hover:bg-black/5 dark:border-white/10 dark:bg-[#12101d]/70 dark:text-slate-100 dark:hover:bg-white/5"
						aria-label="Filter"
					>
						{#if showSidebar}
							<svg
								class="hidden h-5 w-5 lg:block"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg
							>
							<svg
								class="h-5 w-5 lg:hidden"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><path d="M4 6h16M6 12h12M10 18h4" /></svg
							>
						{:else}
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><path d="M4 6h16M6 12h12M10 18h4" /></svg
							>
						{/if}
						<span class="sr-only">Filter</span>
					</button>

					<div
						class="inline-flex rounded-md border border-black/5 bg-slate-100/70 dark:border-white/10 dark:bg-white/5"
						role="tablist"
						aria-label="Switch view"
						tabindex="0"
						on:keydown={handleViewKeydown}
					>
						<button
							on:click={() => (activeView = 'table')}
							class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
							class:bg-white={activeView === 'table'}
							class:dark:bg-[#12101d]={activeView === 'table'}
							class:shadow={activeView === 'table'}
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
								><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><line
									x1="3.5"
									y1="9"
									x2="20.5"
									y2="9"
								></line><line x1="3.5" y1="13" x2="20.5" y2="13"></line><line
									x1="3.5"
									y1="17"
									x2="20.5"
									y2="17"
								></line></svg
							>
							<span class="sr-only">Tampilan Tabel</span>
						</button>
						<button
							on:click={() => (activeView = 'list')}
							class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
							class:bg-white={activeView === 'list'}
							class:dark:bg-[#12101d]={activeView === 'list'}
							class:shadow={activeView === 'list'}
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
								><circle cx="5" cy="6" r="1.3"></circle><circle cx="5" cy="12" r="1.3"
								></circle><circle cx="5" cy="18" r="1.3"></circle><line x1="9" y1="6" x2="20" y2="6"
								></line><line x1="9" y1="12" x2="20" y2="12"></line><line
									x1="9"
									y1="18"
									x2="20"
									y2="18"
								></line></svg
							>
							<span class="sr-only">Tampilan List</span>
						</button>
					</div>
				</div>

				<!-- kanan: search + tambah -->
				<div class="flex min-w-0 flex-1 items-center gap-2">
					<div class="relative min-w-0 flex-1">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<svg
								class="h-5 w-5 text-black dark:text-white"
								viewBox="0 0 20 20"
								fill="currentColor"
								><path
									fill-rule="evenodd"
									d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
									clip-rule="evenodd"
								/></svg
							>
						</div>
						<input
							type="text"
							placeholder="Cari sertifikat..."
							bind:value={search}
							on:input={handleSearchDebounced}
							class="block h-9 w-full rounded-md border border-black/5 bg-white/70 pr-3 pl-10 text-sm
                     text-slate-800 placeholder-slate-500 backdrop-blur focus:ring-1 focus:ring-violet-500
                     focus:outline-none dark:border-white/10 dark:bg-[#12101d]/70 dark:text-slate-100 dark:placeholder-slate-400"
						/>
					</div>
					{#if canCreateCertificate}
						<button
							on:click={openCreateModal}
							class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-violet-600 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-violet-700 active:scale-95"
							aria-label="Tambah Sertifikat"
							title="Tambah Sertifikat"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="h-5 w-5"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 4.5v15m7.5-7.5h-15"
								/></svg
							>
						</button>
					{/if}
				</div>
			</div>

			<!-- CHIPS -->
			{#if activeFilterChips.length}
				<div
					class="flex flex-wrap items-center gap-2 bg-white/70 px-3 py-2 backdrop-blur dark:bg-[#12101d]/70"
				>
					{#each activeFilterChips as chip}
						<span
							class="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
						>
							{chip.label}
							<button
								type="button"
								aria-label="Hapus filter"
								class="opacity-70 hover:opacity-100"
								on:click={() => clearOneFilter(chip.key)}>✕</button
							>
						</span>
					{/each}
					<button
						type="button"
						class="text-xs font-medium text-violet-700 hover:underline dark:text-violet-300"
						on:click={clearFilters}>Clear</button
					>
				</div>
			{/if}
		</div>

		<!-- KONTEN UTAMA -->
		<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
			{#if loading}
				{#if activeView === 'table'}
					<div
						class="bg-white/70 px-4 shadow-sm backdrop-blur dark:bg-[#12101d]/70"
						role="status"
						aria-busy="true"
					>
						<div class="no-scrollbar overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
								<thead class="bg-transparent">
									<tr>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-20 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-28 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-32 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-16 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-14 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-16 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-12 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
									{#each Array(perPage || 10) as _}
										<tr class="animate-pulse">
											<!-- Nama + project -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
												<div class="mt-2 h-3 w-40 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
											</td>
											<!-- No. Sertifikat -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-36 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>
											<!-- Barang Sertifikat -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-40 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>
											<!-- Status (badge) -->
											<td class="px-3 py-4 whitespace-nowrap">
												<span class="block h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5"
												></span>
											</td>
											<!-- Terbit -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>
											<!-- Expired -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>
											<!-- Aksi -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="flex items-center gap-3">
													<div class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
													<div class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
													<div class="h-5 w-5 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
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
						class="border border-black/5 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
						role="status"
						aria-busy="true"
					>
						<ul class="divide-y divide-slate-200/70 dark:divide-white/10">
							{#each Array(perPage || 10) as _}
								<li class="animate-pulse px-4 py-4 sm:px-6">
									<div class="flex items-center justify-between">
										<div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
										<span class="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5"></span>
									</div>
									<div class="mt-2 flex flex-wrap items-center justify-between gap-3">
										<div class="h-4 w-72 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
										<div class="h-4 w-40 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
									</div>
									<div class="mt-3 flex justify-end gap-2">
										<div class="h-7 w-16 rounded-lg bg-slate-200/70 dark:bg-white/5"></div>
										<div class="h-7 w-14 rounded-lg bg-slate-200/70 dark:bg-white/5"></div>
										<div class="h-7 w-14 rounded-lg bg-slate-200/70 dark:bg-white/5"></div>
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
			{:else if error}
				<p class="mt-4 text-rose-500">{error}</p>
			{:else if items.length === 0}
				<div
					class="mt-4 border border-black/5 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
				>
					<p class="text-sm text-slate-600 dark:text-slate-300">Belum ada data.</p>
				</div>
			{:else}
				{#if activeView === 'list'}
					<div
						class="border border-black/5 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
					>
						<ul class="divide-y divide-slate-200/70 dark:divide-white/10">
							{#each items as item (item.id)}
								<li>
									<a
										href={`/certificates/${item.id}`}
										class="block px-4 py-4 hover:bg-violet-600/5 sm:px-6 dark:hover:bg-white/5"
									>
										<div class="flex items-center justify-between">
											<p class="truncate text-sm font-medium text-violet-700 dark:text-violet-300">
												{item.name}
											</p>
											<span
												class={'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
													getStatusBadgeClasses(item.status)}>{item.status}</span
											>
										</div>
										<div class="mt-2 sm:flex sm:justify-between">
											<p class="text-sm text-slate-600 dark:text-slate-300">
												Project: {item.project?.name || '-'} | Barang: {item.barang_certificate
													?.name || '-'} | No: {item.no_certificate}
											</p>
											<p
												class="mt-2 inline-flex items-center gap-1 text-sm text-slate-500 sm:mt-0 dark:text-slate-400"
											>
												<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"
													><path
														fill-rule="evenodd"
														d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
														clip-rule="evenodd"
													/></svg
												>
												{#if item.date_of_issue}
													Terbit: {new Date(item.date_of_issue).toLocaleDateString('id-ID', {
														day: '2-digit',
														month: 'long',
														year: 'numeric'
													})}
												{:else}Terbit: -{/if}
											</p>
										</div>
									</a>
									<div class="flex justify-end gap-2 px-4 py-2 sm:px-6">
										<button
											on:click|stopPropagation={() => openDetailDrawer(item)}
											class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
											>Detail</button
										>
										{#if canUpdateCertificate}
											<button
												on:click|stopPropagation={() => openEditModal(item)}
												class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
												>Edit</button
											>
										{/if}
										{#if canDeleteCertificate}
											<button
												on:click|stopPropagation={() => handleDelete(item.id)}
												class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
												>Hapus</button
											>
										{/if}
									</div>
								</li>
							{/each}
						</ul>

						{#if items.length > 0}
							<Pagination
								{currentPage}
								{lastPage}
								onPageChange={goToPage}
								{totalItems}
								itemsPerPage={perPage}
								{perPageOptions}
								onPerPageChange={(n) => {
									perPage = n;
									currentPage = 1;
									fetchList();
								}}
							/>
						{/if}
					</div>
				{/if}

				{#if activeView === 'table'}
					<div class="bg-white/70 px-4 shadow-sm backdrop-blur dark:bg-[#12101d]/70">
						<div class="no-scrollbar overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
								<thead>
									<tr>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Nama</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>No. Sertifikat</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Barang Sertifikat</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Status</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Terbit</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Expired</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Aksi</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
									{#each items as item (item.id)}
										<tr>
											<td
												class="px-3 py-4 text-sm font-medium whitespace-nowrap text-slate-900 dark:text-slate-100"
											>
												<a
													href={`/certificates/${item.id}`}
													class="text-violet-700 hover:underline dark:text-violet-300"
													>{item.name}</a
												><br />
												<span class="text-xs text-slate-500 dark:text-slate-400"
													>{item.project?.name || '-'}</span
												>
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
												>{item.no_certificate}</td
											>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
												>{item.barang_certificate?.name || '-'}</td
											>
											<td class="px-3 py-4 text-sm whitespace-nowrap">
												<span
													class={'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
														getStatusBadgeClasses(item.status)}>{item.status}</span
												>
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
											>
												{#if item.date_of_issue}
													{new Date(item.date_of_issue).toLocaleDateString('id-ID', {
														day: '2-digit',
														month: 'short',
														year: 'numeric'
													})}
												{:else}-{/if}
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
											>
												{#if item.date_of_expired}
													{new Date(item.date_of_expired).toLocaleDateString('id-ID', {
														day: '2-digit',
														month: 'short',
														year: 'numeric'
													})}
												{:else}-{/if}
											</td>
											<td class="relative px-3 py-4 text-sm whitespace-nowrap">
												<div class="flex items-center gap-2">
													<button
														on:click={() => openDetailDrawer(item)}
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
															stroke-linecap="round"
															stroke-linejoin="round"
															><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle
																cx="12"
																cy="12"
																r="3"
															></circle></svg
														>
														<span class="sr-only">Detail, {item.name}</span>
													</button>
													{#if canUpdateCertificate}
														<button
															on:click|stopPropagation={() => openEditModal(item)}
															title="Edit"
															class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
														>
															<svg
																class="h-5 w-5"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																><path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
																/></svg
															>
															<span class="sr-only">Edit, {item.name}</span>
														</button>
													{/if}
													{#if canDeleteCertificate}
														<button
															on:click|stopPropagation={() => handleDelete(item.id)}
															title="Delete"
															class="text-rose-600 hover:text-rose-700"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="20"
																height="20"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
																><polyline points="3 6 5 6 21 6"></polyline><path
																	d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
																></path><line x1="10" y1="11" x2="10" y2="17"></line><line
																	x1="14"
																	y1="11"
																	x2="14"
																	y2="17"
																/></svg
															>
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

						{#if items.length > 0}
							<Pagination
								{currentPage}
								{lastPage}
								onPageChange={goToPage}
								{totalItems}
								itemsPerPage={perPage}
								{perPageOptions}
								onPerPageChange={(n) => {
									perPage = n;
									currentPage = 1;
									fetchList();
								}}
							/>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</section>
</div>

<!-- FILTER (mobile) -->
{#if showMobileFilter}
	<CertificateFilterMobile
		bind:open={showMobileFilter}
		statusOptions={statusOptions as unknown as string[]}
		statusValue={statusFilter}
		dateFrom={dateFromFilter}
		dateTo={dateToFilter}
		{sortBy}
		{sortDir}
		{dateSortField}
		on:update={(e) => {
			const { key, value } = e.detail as {
				key: 'status' | 'dateFrom' | 'dateTo' | 'sortBy' | 'sortDir' | 'dateSortField';
				value: any;
			};
			if (key === 'status') statusFilter = value as typeof statusFilter;
			if (key === 'dateFrom') dateFromFilter = value as string;
			if (key === 'dateTo') dateToFilter = value as string;
			if (key === 'sortBy') sortBy = value as typeof sortBy;
			if (key === 'sortDir') sortDir = value as typeof sortDir;
			if (key === 'dateSortField') {
				dateSortField = value as typeof dateSortField;
				if (sortBy !== 'created') sortBy = dateSortField;
			}
		}}
		on:clear={() => clearFilters()}
		on:apply={() => {
			showMobileFilter = false;
			handleFilterOrSearch();
		}}
		on:close={() => (showMobileFilter = false)}
	/>
{/if}

<!-- MODALS / DRAWER -->
<CertificateFormModal
	bind:show={showCreateModal}
	title="Tambah Sertifikat"
	submitLabel="Simpan"
	idPrefix="create"
	{form}
	{projects}
	barangOptions={filteredBarangCertificates}
	statuses={statusOptions}
	handleProjectChange={(pid: number | '' | null) => {
		if (pid) fetchBarangCertificatesByProject(Number(pid));
		else filteredBarangCertificates = [];
		form.barang_certificate_id = '';
	}}
	onSubmit={handleSubmitCreate}
/>

{#if editingItem}
	<CertificateFormModal
		bind:show={showEditModal}
		title="Edit Sertifikat"
		submitLabel="Update"
		idPrefix="edit"
		{form}
		{projects}
		barangOptions={filteredBarangCertificates}
		statuses={statusOptions}
		handleProjectChange={(pid: number | '' | null) => {
			if (pid) fetchBarangCertificatesByProject(Number(pid));
			else filteredBarangCertificates = [];
			form.barang_certificate_id = '';
		}}
		onSubmit={handleSubmitUpdate}
	/>
{/if}

<Drawer
	bind:show={showDetailDrawer}
	title="Detail Sertifikat"
	on:close={() => (showDetailDrawer = false)}
>
	<CertificateDetail certificates={selectedItem} />
</Drawer>
