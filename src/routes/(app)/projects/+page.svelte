<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiFetch, getToken } from '$lib/api';
	import Drawer from '$lib/components/Drawer.svelte';
	import ProjectDetail from '$lib/components/detail/ProjectDetail.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ProjectFormModal from '$lib/components/form/ProjectFormModal.svelte';
	import ProjectFilterDesktop from '$lib/components/filters/ProjectFilterDesktop.svelte';
	import ProjectFilterMobile from '$lib/components/filters/ProjectFilterMobile.svelte';
	import { userPermissions } from '$lib/stores/permissions';

	// ====== DATA ======
	let projects: any[] = [];
	let customers: any[] = [];
	let loading = true;
	let error = '';

	// ====== PERMISSIONS (reactive) ======
	let canCreate = false;
	let canUpdate = false;
	let canDelete = false;

	// Svelte auto-subscribe: $userPermissions tersedia jika store diimport
	$: {
		const perms = $userPermissions ?? [];
		canCreate = perms.includes('project-create');
		canUpdate = perms.includes('project-update');
		canDelete = perms.includes('project-delete');
	}

	// ====== FILTER / QUERY STATE ======
	let search = '';
	let statusFilter = '';
	let kategoriFilter = '';
	let certProjectFilter = false;
	let dateFromFilter = '';
	let dateToFilter = '';

	// kontrol sorting
	let sortBy: 'created' | 'start_date' = 'created';
	let sortDir: 'desc' | 'asc' = 'desc';

	// ====== UI STATE ======
	// view toggle
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
	let showSidebar = true; // desktop toggle
	let showMobileFilter = false; // mobile modal

	function applyUpdate(
		key: 'status' | 'kategori' | 'cert' | 'dateFrom' | 'dateTo' | 'sortBy' | 'sortDir',
		value: any
	) {
		if (key === 'status') statusFilter = value as string;
		if (key === 'kategori') kategoriFilter = value as string;
		if (key === 'cert') certProjectFilter = Boolean(value);
		if (key === 'dateFrom') dateFromFilter = value as string;
		if (key === 'dateTo') dateToFilter = value as string;
		if (key === 'sortBy') sortBy = value as 'created' | 'start_date';
		if (key === 'sortDir') sortDir = value as 'desc' | 'asc';
	}

	// desktop: update + fetch
	function onDesktopUpdate(e: CustomEvent<{ key: any; value: any }>) {
		applyUpdate(e.detail.key, e.detail.value);
		handleFilterOrSearch();
	}
	function onDesktopClear() {
		clearFilters();
	}

	// mobile: update state saja, fetch saat Done
	function onMobileUpdate(e: CustomEvent<{ key: any; value: any }>) {
		applyUpdate(e.detail.key, e.detail.value);
	}
	function onMobileClear() {
		clearFilters();
	}
	function onMobileApply() {
		showMobileFilter = false;
		handleFilterOrSearch();
	}

	// modal form & drawer
	let showCreateModal = false;
	let showEditModal = false;
	let editingProject: any = null;
	let showDetailDrawer = false;
	let selectedProject: any = null;

	// pagination
	let currentPage = 1;
	let lastPage = 1;
	let totalProjects = 0;
	let perPage = 50;
	const perPageOptions = [10, 25, 50, 100];

	// form
	let form = {
		name: '',
		description: '',
		status: '',
		start_date: '',
		finish_date: '',
		mitra_id: '',
		kategori: '',
		lokasi: '',
		no_po: '',
		no_so: '',
		is_cert_projects: false
	};

	// options
	let projectStatuses: string[] = [];
	let projectKategoris: string[] = [];

	// ====== HELPERS ======
	function qs(obj: Record<string, any>) {
		const p = new URLSearchParams();
		Object.entries(obj).forEach(([k, v]) => {
			if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
		});
		return p.toString();
	}

	async function fetchProjects() {
		loading = true;
		error = '';
		try {
			const url = `/projects?${qs({
				search,
				status: statusFilter,
				kategori: kategoriFilter,
				is_cert_projects: certProjectFilter ? 1 : '',
				date_from: dateFromFilter,
				date_to: dateToFilter,
				page: currentPage,
				per_page: perPage,
				sort_by: sortBy,
				sort_dir: sortDir
			})}`;

			const res: any = await apiFetch(url, { auth: true });
			projects = res?.data ?? res?.items ?? res?.projects ?? res ?? [];
			currentPage = res?.pagination?.current_page ?? res?.current_page ?? 1;
			lastPage = res?.pagination?.last_page ?? res?.last_page ?? 1;
			totalProjects =
				res?.pagination?.total ?? res?.total ?? (Array.isArray(projects) ? projects.length : 0);
		} catch (err: any) {
			error = err?.message || 'Gagal memuat project.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function fetchProjectFormDependencies() {
		try {
			const res: any = await apiFetch('/projects/getFormDependencies', { auth: true });
			const root = res?.data ?? res ?? {};

			customers = Array.isArray(root.customers) ? root.customers : [];
			projectStatuses = Array.isArray(root.project_status_list) ? root.project_status_list : [];
			projectKategoris = Array.isArray(root.project_kategori_list)
				? root.project_kategori_list
				: [];
		} catch (err) {
			console.error('Failed to fetch project form dependencies:', err);
		}
	}

	onMount(() => {
		if (!getToken()) {
			goto('/auth/login');
			return;
		}
		fetchProjects();
		fetchProjectFormDependencies();
	});

	let searchTimer: ReturnType<typeof setTimeout>;

	function handleFilterOrSearch() {
		currentPage = 1;
		fetchProjects();
	}

	function handleSearchDebounced() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			handleFilterOrSearch();
		}, 500);
	}

	function clearFilters() {
		search = '';
		statusFilter = '';
		kategoriFilter = '';
		certProjectFilter = false;
		dateFromFilter = '';
		dateToFilter = '';
		sortBy = 'created';
		sortDir = 'desc';
		search = '';
		currentPage = 1;
		fetchProjects();
	}

	function clearOneFilter(key: 'status' | 'kategori' | 'cert' | 'date' | 'sort' | 'search') {
		if (key === 'status') statusFilter = '';
		if (key === 'kategori') kategoriFilter = '';
		if (key === 'cert') certProjectFilter = false;
		if (key === 'date') {
			dateFromFilter = '';
			dateToFilter = '';
		}
		if (key === 'sort') {
			sortBy = 'created';
			sortDir = 'desc';
		}
		if (key === 'search') search = '';
		handleFilterOrSearch();
	}

	function toggleFilter() {
		if (typeof window !== 'undefined' && window.innerWidth < 1024) {
			showMobileFilter = true; // mobile -> modal
		} else {
			showSidebar = !showSidebar; // desktop -> show/hide sidebar
		}
	}

	function goToPage(page: number) {
		if (page > 0 && page <= lastPage) {
			currentPage = page;
			fetchProjects();
		}
	}

	function openCreateModal() {
		if (!canCreate) {
			console.warn('Blocked: missing project-create permission');
			return;
		}
		form = {
			name: '',
			description: '',
			status: '',
			start_date: '',
			finish_date: '',
			mitra_id: '',
			kategori: '',
			lokasi: '',
			no_po: '',
			no_so: '',
			is_cert_projects: false
		};
		showCreateModal = true;
	}
	function openEditModal(project: any) {
		if (!canUpdate) {
			console.warn('Blocked: missing project-update permission');
			return;
		}
		editingProject = { ...project };
		form = {
			...editingProject,
			mitra_id: editingProject.mitra_id || '',
			is_cert_projects: !!editingProject.is_cert_projects
		};
		showEditModal = true;
	}
	function openDetailDrawer(project: any) {
		selectedProject = { ...project };
		showDetailDrawer = true;
	}

	async function handleSubmitCreate() {
		if (!canCreate) {
			console.warn('Blocked: missing project-create permission (submit create)');
			return;
		}
		try {
			await apiFetch('/projects', { method: 'POST', body: form, auth: true });
			alert('Project berhasil ditambahkan!');
			goto('/projects');
			showCreateModal = false;
			fetchProjects();
		} catch (err: any) {
			const msg = err?.message || 'Gagal menambahkan project.';
			alert('Error:\n' + msg);
		}
	}

	async function handleSubmitUpdate() {
		if (!editingProject?.id) return;
		if (!canUpdate) {
			console.warn('Blocked: missing project-update permission (submit update)');
			return;
		}
		try {
			await apiFetch(`/projects/${editingProject.id}`, { method: 'PUT', body: form, auth: true });
			alert('Project berhasil diperbarui!');
			goto('/projects');
			showEditModal = false;
			fetchProjects();
		} catch (err: any) {
			const msg = err?.message || 'Gagal memperbarui project.';
			alert('Error:\n' + msg);
		}
	}

	async function handleDelete(projectId: number) {
		if (!canDelete) {
			console.warn('Blocked: missing project-delete permission (delete)');
			return;
		}
		if (!confirm('Apakah Anda yakin ingin menghapus project ini?')) return;
		try {
			await apiFetch(`/projects/${projectId}`, { method: 'DELETE', auth: true });
			alert('Project berhasil dihapus!');
			goto('/projects');
			fetchProjects();
		} catch (err: any) {
			alert('Gagal menghapus project: ' + (err?.message || 'Terjadi kesalahan'));
		}
	}

	// --- kunci scroll saat drawer filter mobile terbuka ---
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

	// Badge (selaras Dashboard)
	function getStatusBadgeClasses(status: string) {
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

	// 🔁 ganti reaktif chips jadi include chip sorting
	$: activeFilterChips = [
		statusFilter ? { key: 'status', label: statusFilter } : null,
		kategoriFilter ? { key: 'kategori', label: kategoriFilter } : null,
		certProjectFilter ? { key: 'cert', label: 'Certificate' } : null,
		dateFromFilter || dateToFilter
			? {
					key: 'date',
					label:
						dateFromFilter && dateToFilter
							? `${new Date(dateFromFilter).toLocaleDateString('id-ID')} - ${new Date(dateToFilter).toLocaleDateString('id-ID')}`
							: dateFromFilter
								? `Dari ${new Date(dateFromFilter).toLocaleDateString('id-ID')}`
								: `Sampai ${new Date(dateToFilter).toLocaleDateString('id-ID')}`
				}
			: null,
		sortBy === 'start_date'
			? {
					key: 'sort',
					label: `Urut: Dilaksanakan ${sortDir === 'desc' ? 'Terbaru dulu' : 'Terlama dulu'}`
				}
			: sortDir === 'asc'
				? { key: 'sort', label: 'Urut: Create Terlama' }
				: null,
		search && { key: 'search', label: `Cari: ${search}` }
	].filter(Boolean) as Array<{
		key: 'status' | 'kategori' | 'cert' | 'date' | 'sort' | 'search';
		label: string;
	}>;
</script>

<svelte:head><title>Daftar Project - Indogreen</title></svelte:head>

<!-- ====== GRID 2 KOLOM: SIDEBAR + KONTEN ====== -->
<div class={'grid grid-cols-1 gap-4 ' + (showSidebar ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : '')}>
	<!-- KIRI: Sidebar filter (muncul hanya saat showSidebar true) -->
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<aside
		role="complementary"
		aria-label="Filter"
		class={'hidden ' + (showSidebar ? 'lg:block' : 'lg:hidden')}
	>
		<!-- Tetap melekat di bawah navbar -->
		<div class="sticky top-[72px]">
			<!-- Tinggi kolom = tinggi viewport - navbar(72) - padding main(48) -->
			<div
				class="no-scrollbar max-h-[calc(100dvh-72px-48px)] overflow-y-auto overscroll-contain [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]"
			>
				<ProjectFilterDesktop
					statusOptions={projectStatuses}
					kategoriOptions={projectKategoris}
					statusValue={statusFilter}
					kategoriValue={kategoriFilter}
					certValue={certProjectFilter}
					dateFrom={dateFromFilter}
					dateTo={dateToFilter}
					{sortBy}
					{sortDir}
					on:update={onDesktopUpdate}
					on:clear={onDesktopClear}
				/>
			</div>
		</div>
	</aside>

	<!-- KANAN: konten utama -->
	<section
		class="flex min-h-[calc(100dvh-60px-48px)] min-w-0 flex-col sm:min-h-[calc(100dvh-72px-48px)]"
	>
		<!-- sticky BAR hanya selebar kolom kanan -->
		<div
			class="sticky top-[60px] z-30 divide-y divide-black/5 border border-black/5 sm:top-[72px] dark:divide-white/10 dark:border-white/10"
		>
			<!-- ACTION BAR -->
			<div
				class="flex flex-nowrap items-center gap-2
                  bg-white/70 px-2 py-2
                  backdrop-blur dark:bg-[#12101d]/70"
			>
				<!-- Kiri: Filter + toggle view -->
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
								stroke-linejoin="round"
							>
								<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
							</svg>

							<svg
								class="h-5 w-5 lg:hidden"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M4 6h16M6 12h12M10 18h4" />
							</svg>
						{:else}
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M4 6h16M6 12h12M10 18h4" />
							</svg>
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

				<!-- Kanan: Search + Tambah -->
				<div class="flex min-w-0 flex-1 items-center gap-2">
					<div class="relative min-w-0 flex-1">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<svg
								class="h-5 w-5 text-black dark:text-white"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<input
							type="text"
							placeholder="Cari project..."
							bind:value={search}
							on:input={handleSearchDebounced}
							class="block h-9 w-full rounded-md border border-black/5 bg-white/70 pr-3 pl-10 text-sm
                     text-slate-800 placeholder-slate-500 backdrop-blur focus:ring-1 focus:ring-violet-500
                     focus:outline-none dark:border-white/10 dark:bg-[#12101d]/70 dark:text-slate-100 dark:placeholder-slate-400"
						/>
					</div>
					{#if canCreate}
						<button
							on:click={openCreateModal}
							class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-violet-600 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-violet-700 active:scale-95"
							aria-label="Tambah Project"
							title="Tambah Project"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="h-5 w-5"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
						</button>
					{/if}
				</div>
			</div>
			<!-- CHIPS -->
			{#if activeFilterChips.length}
				<div
					class="flex flex-wrap items-center gap-2
                    bg-white/70 px-3 py-2
                    backdrop-blur dark:bg-[#12101d]/70"
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

		<!-- SECTION KONTEN DI BAWAH BAR -->
		<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
			{#if loading}
				{#if activeView === 'table'}
					<!-- TABLE SKELETON -->
					<div
						class="bg-white/70 px-4 shadow-sm backdrop-blur dark:bg-[#12101d]/70"
						role="status"
						aria-busy="true"
					>
						<div class="no-scrollbar overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
								<!-- Pakai kelas sticky yang sama dengan versi nyata thead kamu -->
								<thead class="bg-transparent">
									<tr>
										<th class="px-3 py-3.5 text-left">
											<div
												class="h-4 w-32 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div>
										</th>
										<th class="px-3 py-3.5 text-left">
											<div
												class="h-4 w-24 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div>
										</th>
										<th class="px-3 py-3.5 text-left">
											<div
												class="h-4 w-12 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div>
										</th>
										<th class="px-3 py-3.5 text-left">
											<div
												class="h-4 w-20 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div>
										</th>
										<th class="px-3 py-3.5 text-left">
											<div
												class="h-4 w-16 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div>
										</th>
										<th class="px-3 py-3.5 text-left">
											<div
												class="h-4 w-24 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div>
										</th>
										<th class="px-3 py-3.5 text-left">
											<div
												class="h-4 w-14 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div>
										</th>
									</tr>
								</thead>

								<tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
									{#each Array(perPage || 10) as _}
										<tr class="animate-pulse">
											<!-- Nama Project + customer -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
												<div class="mt-2 h-3 w-32 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
											</td>

											<!-- Lokasi -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>

											<!-- Tahun -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-10 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>

											<!-- Kategori -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-24 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>

											<!-- Status + badge certificate -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="flex items-center gap-2">
													<span class="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5"
													></span>
													<span class="h-5 w-16 rounded-full bg-slate-200/50 dark:bg-white/5"
													></span>
												</div>
											</td>

											<!-- Dilaksanakan (start/finish) -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="space-y-1">
													<div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
													<div class="h-4 w-24 rounded-md bg-slate-200/50 dark:bg-white/5"></div>
												</div>
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

						<!-- Pagination skeleton (biar tinggi area bawah stabil) -->
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
			{:else if projects.length === 0}
				<div
					class="mt-4 border border-black/5 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
				>
					<p class="text-sm text-slate-600 dark:text-slate-300">Belum ada project.</p>
				</div>
			{:else}
				{#if activeView === 'list'}
					<!-- LIST VIEW -->
					<div
						class="border border-black/5 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
					>
						<ul class="divide-y divide-slate-200/70 dark:divide-white/10">
							{#each projects as project (project.id)}
								<li>
									<a
										href={`/projects/${project.id}`}
										class="block px-4 py-4 hover:bg-violet-600/5 sm:px-6 dark:hover:bg-white/5"
									>
										<div class="flex items-center justify-between">
											<p class="truncate text-sm font-medium text-violet-700 dark:text-violet-300">
												{project.name}
											</p>
											<div class="ml-2 flex flex-shrink-0 gap-2">
												<span
													class={'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
														getStatusBadgeClasses(project.status)}>{project.status}</span
												>
												{#if project.is_cert_projects}
													<span
														class="inline-flex rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300"
														>Certificate</span
													>
												{/if}
											</div>
										</div>
										<div class="mt-2 sm:flex sm:justify-between">
											<p class="text-sm text-slate-600 dark:text-slate-300">
												Customer: {project.mitra?.nama || '-'} | Deskripsi: {project.description?.substring(
													0,
													50
												) || ''}{project.description?.length > 50 ? '...' : ''}
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
												Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', {
													day: '2-digit',
													month: 'long',
													year: 'numeric'
												})}
											</p>
										</div>
									</a>

									<div class="flex justify-end gap-2 px-4 py-2 sm:px-6">
										<button
											on:click|stopPropagation={() => openDetailDrawer(project)}
											class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
											>Detail</button
										>
										{#if canUpdate}
											<button
												on:click|stopPropagation={() => openEditModal(project)}
												class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
												>Edit</button
											>
										{/if}
										{#if canDelete}
											<button
												on:click|stopPropagation={() => handleDelete(project.id)}
												class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
												>Hapus</button
											>
										{/if}
									</div>
								</li>
							{/each}
						</ul>

						{#if projects.length > 0}
							<Pagination
								{currentPage}
								{lastPage}
								onPageChange={goToPage}
								totalItems={totalProjects}
								itemsPerPage={perPage}
								{perPageOptions}
								onPerPageChange={(n) => {
									perPage = n;
									currentPage = 1;
									fetchProjects();
								}}
							/>
						{/if}
					</div>
				{/if}

				{#if activeView === 'table'}
					<!-- TABLE VIEW -->
					<div class="bg-white/70 px-4 shadow-sm backdrop-blur dark:bg-[#12101d]/70">
						<div class="no-scrollbar overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
								<thead>
									<tr>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Nama Project</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Lokasi</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Tahun</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Kategori</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Status</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Dilaksanakan</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Aksi</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
									{#each projects as project (project.id)}
										<tr>
											<td
												class="px-3 py-4 text-sm font-medium whitespace-nowrap text-slate-900 dark:text-slate-100"
											>
												<a
													href={`/projects/${project.id}`}
													class="text-violet-700 hover:underline dark:text-violet-300"
													>{project.name}</a
												><br />
												<span class="text-xs text-slate-500 dark:text-slate-400"
													>{project.mitra?.nama}</span
												>
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
											>
												{project.lokasi?.substring(0, 40)}{project.lokasi?.length > 40 ? '...' : ''}
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
											>
												{new Date(project.start_date).toLocaleDateString('id-ID', {
													year: 'numeric'
												})}
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
												>{project.kategori || '-'}</td
											>
											<td class="px-3 py-4 text-sm whitespace-nowrap">
												<div class="flex items-center gap-2">
													<span
														class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold {getStatusBadgeClasses(
															project.status
														)}">{project.status}</span
													>
													{#if project.is_cert_projects}
														<span
															class="inline-flex rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300"
															>Certificate</span
														>
													{/if}
												</div>
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
											>
												{new Date(project.start_date).toLocaleDateString('id-ID', {
													day: '2-digit',
													month: 'short',
													year: 'numeric'
												})}<br />
												{#if project.finish_date}
													{new Date(project.finish_date).toLocaleDateString('id-ID', {
														day: '2-digit',
														month: 'short',
														year: 'numeric'
													})}
												{:else}-{/if}
											</td>
											<td class="relative px-3 py-4 text-sm whitespace-nowrap">
												<div class="flex items-center gap-2">
													<button
														on:click={() => openDetailDrawer(project)}
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
														<span class="sr-only">Detail, {project.name}</span>
													</button>
													{#if canUpdate}
														<button
															on:click|stopPropagation={() => openEditModal(project)}
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
															<span class="sr-only">Edit, {project.name}</span>
														</button>
													{/if}
													{#if canDelete}
														<button
															on:click|stopPropagation={() => handleDelete(project.id)}
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
																></line></svg
															>
															<span class="sr-only">Hapus, {project.name}</span>
														</button>
													{/if}
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						{#if projects.length > 0}
							<Pagination
								{currentPage}
								{lastPage}
								onPageChange={goToPage}
								totalItems={totalProjects}
								itemsPerPage={perPage}
								{perPageOptions}
								onPerPageChange={(n) => {
									perPage = n;
									currentPage = 1;
									fetchProjects();
								}}
							/>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</section>
</div>

<!-- ====== MODAL FILTER (MOBILE) ====== -->
{#if showMobileFilter}
	<ProjectFilterMobile
		bind:open={showMobileFilter}
		statusOptions={projectStatuses}
		kategoriOptions={projectKategoris}
		statusValue={statusFilter}
		kategoriValue={kategoriFilter}
		certValue={certProjectFilter}
		dateFrom={dateFromFilter}
		dateTo={dateToFilter}
		{sortBy}
		{sortDir}
		on:update={onMobileUpdate}
		on:clear={onMobileClear}
		on:apply={onMobileApply}
		on:close={() => (showMobileFilter = false)}
	/>
{/if}

<!-- ====== MODALS / DRAWER ====== -->
<ProjectFormModal
	bind:show={showCreateModal}
	title="Form Project Baru"
	submitLabel="Tambah Project"
	idPrefix="create"
	{form}
	{customers}
	{projectStatuses}
	{projectKategoris}
	onSubmit={handleSubmitCreate}
/>

{#if editingProject}
	<ProjectFormModal
		bind:show={showEditModal}
		title="Edit Project"
		submitLabel="Update Project"
		idPrefix="edit"
		{form}
		{customers}
		{projectStatuses}
		{projectKategoris}
		onSubmit={handleSubmitUpdate}
	/>
{/if}

<Drawer
	bind:show={showDetailDrawer}
	title="Detail Project"
	on:close={() => (showDetailDrawer = false)}
>
	<ProjectDetail project={selectedProject} />
</Drawer>
