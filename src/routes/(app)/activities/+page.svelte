<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiFetch, getToken } from '$lib/api';

	import Drawer from '$lib/components/Drawer.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ActivityDetail from '$lib/components/detail/ActivityDetail.svelte';
	import ActivityFormModal from '$lib/components/form/ActivityFormModal.svelte';

	import ActivityFilterDesktop from '$lib/components/filters/ActivityFilterDesktop.svelte';
	import ActivityFilterMobile from '$lib/components/filters/ActivityFilterMobile.svelte';
	import { userPermissions } from '$lib/stores/permissions';

	// ===== DATA =====
	let activities: any[] = [];
	let projects: any[] = [];
	let vendors: any[] = [];
	let customers: any[] = [];
	let activityKategoriList: string[] = [];
	let activityJenisList: string[] = [];
	let loading = true;
	let error = '';

	// ===== PERMISSIONS =====
	let canCreateActivity = false;
	let canUpdateActivity = false;
	let canDeleteActivity = false;
	$: {
		const perms = $userPermissions ?? [];
		canCreateActivity = perms.includes('activity-create');
		canUpdateActivity = perms.includes('activity-update');
		canDeleteActivity = perms.includes('activity-delete');
	}

	// ===== FILTER / QUERY STATE =====
	let search = '';
	let jenisFilter = '';
	let kategoriFilter = '';
	let dateFromFilter = '';
	let dateToFilter = '';
	let sortBy: 'created' | 'activity_date' = 'activity_date';
	let sortDir: 'desc' | 'asc' = 'asc';

	// ===== UI STATE =====
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

	// desktop sidebar & mobile modal
	let showSidebar = true;
	let showMobileFilter = false;

	// modal & drawer
	let showCreateModal = false;
	let showEditModal = false;
	let editingActivity: any = null;

	let showDetailDrawer = false;
	let selectedActivity: any = null;

	// pagination
	let currentPage = 1;
	let lastPage = 1;
	let totalActivities = 0;
	let perPage = 50;
	const perPageOptions = [10, 25, 50, 100];

	// form state (ringkas — form lengkap di ActivityFormModal)
	let form: any = {
		name: '',
		short_desc: '',
		description: '',
		project_id: '',
		kategori: '',
		value: 0,
		activity_date: '',
		jenis: '',
		mitra_id: null,
		from: '',
		to: '',
		attachments: [],
		attachment_names: [],
		attachment_descriptions: [],
		existing_attachments: [],
		removed_existing_ids: []
	};

	// ===== HELPERS =====
	function qs(obj: Record<string, any>) {
		const p = new URLSearchParams();
		Object.entries(obj).forEach(([k, v]) => {
			if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
		});
		return p.toString();
	}

	// ===== API =====
	async function fetchActivities() {
		loading = true;
		error = '';
		try {
			const url = `/activities?${qs({
				search,
				jenis: jenisFilter,
				kategori: kategoriFilter,
				date_from: dateFromFilter,
				date_to: dateToFilter,
				page: currentPage,
				per_page: perPage,
				sort_by: sortBy,
				sort_dir: sortDir
			})}`;
			const res: any = await apiFetch(url, { auth: true });
			activities = res?.data ?? res?.items ?? res ?? [];
			currentPage = res?.pagination?.current_page ?? res?.current_page ?? 1;
			lastPage = res?.pagination?.last_page ?? res?.last_page ?? 1;
			totalActivities =
				res?.pagination?.total ?? res?.total ?? (Array.isArray(activities) ? activities.length : 0);
		} catch (err: any) {
			error = err?.message || 'Gagal memuat aktivitas.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function fetchFormDependencies() {
		try {
			const dep: any = await apiFetch('/activity/getFormDependencies', { auth: true });
			projects = dep?.projects ?? dep?.data?.projects ?? [];
			vendors = dep?.vendors ?? dep?.data?.vendors ?? [];

			activityKategoriList = Array.isArray(dep.kategori_list) ? dep.kategori_list : [];

			activityJenisList = Array.isArray(dep.jenis_list) ? dep.jenis_list : [];

			try {
				const cust: any = await apiFetch('/mitra/customers', { auth: true });
				customers = cust?.data ?? cust ?? [];
			} catch (e) {
				customers = [];
				console.warn('Fetch customers (optional) gagal:', e);
			}
		} catch (err) {
			console.error('Failed to fetch dependencies:', err);
		}
	}

	onMount(() => {
		if (!getToken()) {
			goto('/auth/login');
			return;
		}
		fetchActivities();
		fetchFormDependencies();
	});

	function handleFilterOrSearch() {
		currentPage = 1;
		fetchActivities();
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
		jenisFilter = '';
		kategoriFilter = '';
		dateFromFilter = '';
		dateToFilter = '';
		sortBy = 'created';
		sortDir = 'desc';
		currentPage = 1;
		search = '';
		fetchActivities();
	}
	function clearOneFilter(key: 'jenis' | 'kategori' | 'date' | 'sort' | 'search') {
		if (key === 'jenis') jenisFilter = '';
		if (key === 'kategori') kategoriFilter = '';
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
			showMobileFilter = true;
		} else {
			showSidebar = !showSidebar;
		}
	}

	function goToPage(page: number) {
		if (page > 0 && page <= lastPage) {
			currentPage = page;
			fetchActivities();
		}
	}

	function openCreateModal() {
		if (!canCreateActivity) {
			console.warn('Blocked: lacking activity-create permission');
			return;
		}
		form = {
			name: '',
			short_desc: '',
			description: '',
			project_id: '',
			kategori: '',
			value: 0,
			activity_date: '',
			jenis: '',
			mitra_id: null,
			from: '',
			to: '',
			attachments: [],
			attachment_names: [],
			attachment_descriptions: [],
			existing_attachments: [],
			removed_existing_ids: []
		};
		showCreateModal = true;
	}
	function openEditModal(a: any) {
		if (!canUpdateActivity) {
			console.warn('Blocked: lacking activity-update permission');
			return;
		}
		editingActivity = { ...a };
		form = {
			name: a.name ?? '',
			short_desc: a.short_desc ?? '',
			description: a.description ?? '',
			project_id: a.project_id ?? '',
			kategori: a.kategori ?? '',
			value: a.value ?? 0,
			activity_date: a.activity_date ? new Date(a.activity_date).toISOString().split('T')[0] : '',
			jenis: a.jenis ?? '',
			mitra_id: a.mitra_id ?? '',
			from: a.from ?? '',
			to: a.to ?? '',
			attachments: [],
			attachment_names: [],
			attachment_descriptions: [],
			existing_attachments: Array.isArray(a.attachments)
				? a.attachments.map((x: any) => ({
						id: x.id,
						name: x.name ?? x.file_name ?? 'Lampiran',
						description: x.description ?? '',
						original_name: x.original_name ?? x.file_name ?? x.name ?? '',
						url: x.url ?? x.path ?? x.file_path,
						size: x.size
					}))
				: [],
			removed_existing_ids: []
		};
		showEditModal = true;
	}
	function openDetailDrawer(a: any) {
		selectedActivity = { ...a };
		showDetailDrawer = true;
	}

	// FormData builder
	function appendScalar(fd: FormData, key: string, val: any) {
		if (val === null || val === undefined || val === '') return;
		fd.append(key, String(val));
	}
	function buildFormDataForActivity() {
		const fd = new FormData();
		appendScalar(fd, 'name', form.name);
		appendScalar(fd, 'short_desc', form.short_desc);
		appendScalar(fd, 'description', form.description);
		appendScalar(fd, 'project_id', form.project_id);
		appendScalar(fd, 'kategori', form.kategori);
		appendScalar(fd, 'value', form.value);
		appendScalar(fd, 'activity_date', form.activity_date);
		appendScalar(fd, 'jenis', form.jenis);
		appendScalar(fd, 'from', form.from);
		appendScalar(fd, 'to', form.to);

		// mitra_id sesuai jenis
		if (form.jenis === 'Internal') {
			fd.set('mitra_id', '1');
		} else if (form.jenis === 'Customer') {
			const p = projects.find((x) => x.id == form.project_id);
			if (p?.mitra_id) fd.set('mitra_id', String(p.mitra_id));
		} else if (form.jenis === 'Vendor' && form.mitra_id) {
			fd.set('mitra_id', String(form.mitra_id));
		}

		(form.attachments || []).forEach((file: File, i: number) =>
			fd.append(`attachments[${i}]`, file)
		);
		(form.attachment_names || []).forEach((n: string, i: number) =>
			fd.append(`attachment_names[${i}]`, n ?? '')
		);
		(form.attachment_descriptions || []).forEach((d: string, i: number) =>
			fd.append(`attachment_descriptions[${i}]`, d ?? '')
		);

		(form.existing_attachments || []).forEach((att: any, i: number) => {
			fd.append(`existing_attachment_ids[${i}]`, String(att.id));
			fd.append(`existing_attachment_names[${i}]`, att.name ?? '');
			fd.append(`existing_attachment_descriptions[${i}]`, att.description ?? '');
		});
		(form.removed_existing_ids || []).forEach((id: number) =>
			fd.append('removed_existing_ids[]', String(id))
		);

		return fd;
	}

	async function handleSubmitCreate() {
		if (!canCreateActivity) {
			console.warn('Blocked: lacking activity-create permission (submit)');
			return;
		}
		try {
			const fd = buildFormDataForActivity();
			await apiFetch('/activities', { method: 'POST', body: fd, auth: true });
			alert('Aktivitas berhasil ditambahkan!');
			goto('/activities');
			showCreateModal = false;
			fetchActivities();
		} catch (err: any) {
			const msg = err?.message || 'Gagal menambahkan aktivitas.';
			alert('Error:\n' + msg);
		}
	}
	async function handleSubmitUpdate() {
		if (!editingActivity?.id) return;
		if (!canUpdateActivity) {
			console.warn('Blocked: lacking activity-update permission (submit)');
			return;
		}
		try {
			const fd = buildFormDataForActivity();
			fd.append('_method', 'PUT');
			await apiFetch(`/activities/${editingActivity.id}`, { method: 'POST', body: fd, auth: true });
			alert('Aktivitas berhasil diperbarui!');
			goto('/activities');
			showEditModal = false;
			fetchActivities();
		} catch (err: any) {
			const msg = err?.message || 'Gagal memperbarui aktivitas.';
			alert('Error:\n' + msg);
		}
	}
	async function handleDelete(id: number) {
		if (!canDeleteActivity) {
			console.warn('Blocked: lacking activity-delete permission');
			return;
		}
		if (!confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) return;
		try {
			await apiFetch(`/activities/${id}`, { method: 'DELETE', auth: true });
			alert('Aktivitas berhasil dihapus!');
			goto('/activities');
			fetchActivities();
		} catch (err: any) {
			alert('Gagal menghapus aktivitas: ' + (err?.message || 'Terjadi kesalahan'));
		}
	}

	// --- lock body scroll saat overlay terbuka ---
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

	// ===== CHIPS =====
	$: activeFilterChips = [
		jenisFilter ? { key: 'jenis' as const, label: jenisFilter } : null,
		kategoriFilter ? { key: 'kategori' as const, label: kategoriFilter } : null,
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
		sortBy === 'activity_date'
			? {
					key: 'sort' as const,
					label: `Urut: Dilaksanakan ${sortDir === 'desc' ? 'Terbaru dulu' : 'Terlama dulu'}`
				}
			: sortBy === 'created' && sortDir === 'asc'
				? { key: 'sort' as const, label: 'Urut: Create Terlama' }
				: null,
		search && { key: 'search', label: `Cari: ${search}` }
	].filter(Boolean) as Array<{
		key: 'jenis' | 'kategori' | 'date' | 'sort' | 'search';
		label: string;
	}>;
</script>

<svelte:head><title>Daftar Activity - Indogreen</title></svelte:head>

<!-- ===== GRID 2 KOLOM ===== -->
<div class={'grid grid-cols-1 gap-4 ' + (showSidebar ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : '')}>
	<!-- SIDEBAR FILTER (desktop) -->
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
				<ActivityFilterDesktop
					jenisOptions={activityJenisList}
					kategoriOptions={activityKategoriList}
					jenisValue={jenisFilter}
					kategoriValue={kategoriFilter}
					dateFrom={dateFromFilter}
					dateTo={dateToFilter}
					{sortBy}
					{sortDir}
					on:update={(e) => {
						const { key, value } = e.detail;
						if (key === 'jenis') jenisFilter = value;
						if (key === 'kategori') kategoriFilter = value;
						if (key === 'dateFrom') dateFromFilter = value;
						if (key === 'dateTo') dateToFilter = value;

						if (key === 'sortBy') sortBy = value;
						if (key === 'sortDir') sortDir = value;

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
								stroke-width="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg
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
							placeholder="Cari aktivitas..."
							bind:value={search}
							on:input={handleSearchDebounced}
							class="block h-9 w-full rounded-md border border-black/5 bg-white/70 pr-3 pl-10 text-sm
                     text-slate-800 placeholder-slate-500 backdrop-blur focus:ring-1 focus:ring-violet-500
                     focus:outline-none dark:border-white/10 dark:bg-[#12101d]/70 dark:text-slate-100 dark:placeholder-slate-400"
						/>
					</div>
					{#if canCreateActivity}
						<button
							on:click={openCreateModal}
							class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-violet-600 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-violet-700 active:scale-95"
							aria-label="Tambah Aktivitas"
							title="Tambah Aktivitas"
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

		<!-- KONTEN -->
		<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
			{#if loading}
				{#if activeView === 'table'}
					<div
						class="bg-white/70 px-4 shadow-sm backdrop-blur dark:bg-[#12101d]/70"
						role="status"
						aria-busy="true"
					>
						<div class="no-scrollbar relative overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
								<thead class="bg-transparent">
									<tr>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-28 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-24 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-20 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-16 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-16 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
											></div></th
										>
										<th class="px-3 py-3.5 text-left"
											><div
												class="h-4 w-18 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/10"
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
											<!-- Nama Aktivitas + deskripsi -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
												<div class="mt-2 h-3 w-40 rounded-md bg-slate-200/60 dark:bg-white/5"></div>
											</td>
											<!-- Project -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-44 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>
											<!-- Kategori (badge) -->
											<td class="px-3 py-4 whitespace-nowrap">
												<span class="block h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5"
												></span>
											</td>
											<!-- Jenis -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-24 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>
											<!-- Mitra -->
											<td class="px-3 py-4 whitespace-nowrap">
												<div class="h-4 w-36 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
											</td>
											<!-- Tanggal -->
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
			{:else if activities.length === 0}
				<div
					class="mt-4 border border-black/5 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
				>
					<p class="text-sm text-slate-600 dark:text-slate-300">Belum ada aktivitas.</p>
				</div>
			{:else}
				{#if activeView === 'list'}
					<div
						class="border border-black/5 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#12101d]/70"
					>
						<ul class="divide-y divide-slate-200/70 dark:divide-white/10">
							{#each activities as activity (activity.id)}
								<li>
									<a
										href={`/activities/${activity.id}`}
										class="block px-4 py-4 hover:bg-violet-600/5 sm:px-6 dark:hover:bg-white/5"
									>
										<div class="flex items-center justify-between">
											<p class="truncate text-sm font-medium text-violet-700 dark:text-violet-300">
												{activity.name}
											</p>
											<span
												class="inline-flex rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
												>{activity.kategori}</span
											>
										</div>
										<div class="mt-2 sm:flex sm:justify-between">
											<p class="text-sm text-slate-600 dark:text-slate-300">
												Project: {activity.project?.name || '-'} | Jenis: {activity.jenis}
												{#if (activity.jenis === 'Vendor' || activity.jenis === 'Customer') && activity.mitra}
													| {activity.jenis}: {activity.mitra.nama}
												{/if}
												| From: {activity.from || '-'} | Deskripsi: {activity.short_desc}
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
												{new Date(activity.activity_date).toLocaleDateString('id-ID', {
													day: '2-digit',
													month: 'long',
													year: 'numeric'
												})}
											</p>
										</div>
									</a>
									<div class="flex justify-end gap-2 px-4 py-2 sm:px-6">
										<button
											on:click|stopPropagation={() => openDetailDrawer(activity)}
											class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
											>Detail</button
										>
										{#if canUpdateActivity}
											<button
												on:click|stopPropagation={() => openEditModal(activity)}
												class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
												>Edit</button
											>
										{/if}
										{#if canDeleteActivity}
											<button
												on:click|stopPropagation={() => handleDelete(activity.id)}
												class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
												>Hapus</button
											>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
						{#if activities.length > 0}
							<Pagination
								{currentPage}
								{lastPage}
								onPageChange={goToPage}
								totalItems={totalActivities}
								itemsPerPage={perPage}
								{perPageOptions}
								onPerPageChange={(n) => {
									perPage = n;
									currentPage = 1;
									fetchActivities();
								}}
							/>
						{/if}
					</div>
				{/if}

				{#if activeView === 'table'}
					<div class="bg-white/70 px-4 shadow-sm backdrop-blur dark:bg-[#12101d]/70">
						<div class="no-scrollbar relative overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
								<thead>
									<tr>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Nama Aktivitas</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Project</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Kategori</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Jenis</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Mitra</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Tanggal</th
										>
										<th
											class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
											>Aksi</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
									{#each activities as a (a.id)}
										<tr>
											<td
												class="px-3 py-4 text-sm font-medium whitespace-nowrap text-slate-900 dark:text-slate-100"
											>
												<a
													href={`/activities/${a.id}`}
													class="text-violet-700 hover:underline dark:text-violet-300">{a.name}</a
												><br />
												<span class="text-xs text-slate-500 dark:text-slate-400"
													>From: {a.from || '-'} | {a.short_desc}</span
												>
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
											>
												{a.project?.name?.substring(0, 25) || '-'}{a.project?.name?.length > 25
													? '...'
													: ''}
											</td>
											<td class="px-3 py-4 text-sm whitespace-nowrap">
												<span
													class="inline-flex rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
													>{a.kategori}</span
												>
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
												>{a.jenis}</td
											>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
											>
												{#if (a.jenis === 'Vendor' || a.jenis === 'Customer') && a.mitra}
													{a.mitra?.nama?.substring(0, 25)}{a.mitra?.nama?.length > 25 ? '...' : ''}
												{:else}-{/if}
											</td>
											<td
												class="px-3 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
											>
												{new Date(a.activity_date).toLocaleDateString('id-ID', {
													day: '2-digit',
													month: 'short',
													year: 'numeric'
												})}
											</td>
											<td class="px-3 py-4 text-sm whitespace-nowrap">
												<div class="flex items-center gap-2">
													<button
														on:click={() => openDetailDrawer(a)}
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
															><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle
																cx="12"
																cy="12"
																r="3"
															/></svg
														>
														<span class="sr-only">Detail, {a.name}</span>
													</button>
													{#if canUpdateActivity}
														<button
															on:click|stopPropagation={() => openEditModal(a)}
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
															<span class="sr-only">Edit, {a.name}</span>
														</button>
													{/if}
													{#if canDeleteActivity}
														<button
															on:click|stopPropagation={() => handleDelete(a.id)}
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
																><polyline points="3 6 5 6 21 6" /><path
																	d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
																/><line x1="10" y1="11" x2="10" y2="17" /><line
																	x1="14"
																	y1="11"
																	x2="14"
																	y2="17"
																/></svg
															>
															<span class="sr-only">Hapus, {a.name}</span>
														</button>
													{/if}
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						{#if activities.length > 0}
							<Pagination
								{currentPage}
								{lastPage}
								onPageChange={goToPage}
								totalItems={totalActivities}
								itemsPerPage={perPage}
								{perPageOptions}
								onPerPageChange={(n) => {
									perPage = n;
									currentPage = 1;
									fetchActivities();
								}}
							/>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</section>
</div>

<!-- ===== MOBILE FILTER ===== -->
{#if showMobileFilter}
	<ActivityFilterMobile
		bind:open={showMobileFilter}
		jenisOptions={activityJenisList}
		kategoriOptions={activityKategoriList}
		jenisValue={jenisFilter}
		kategoriValue={kategoriFilter}
		dateFrom={dateFromFilter}
		dateTo={dateToFilter}
		{sortBy}
		{sortDir}
		on:update={(e) => {
			const { key, value } = e.detail;
			if (key === 'jenis') jenisFilter = value;
			if (key === 'kategori') kategoriFilter = value;
			if (key === 'dateFrom') dateFromFilter = value;
			if (key === 'dateTo') dateToFilter = value;

			// ✅ listen to sorting updates
			if (key === 'sortBy') sortBy = value;
			if (key === 'sortDir') sortDir = value;
		}}
		on:clear={() => clearFilters()}
		on:apply={() => {
			showMobileFilter = false;
			handleFilterOrSearch();
		}}
		on:close={() => (showMobileFilter = false)}
	/>
{/if}

<!-- ===== MODALS / DRAWER ===== -->
<ActivityFormModal
	bind:show={showCreateModal}
	title="Form Aktivitas Baru"
	submitLabel="Tambah Aktivitas"
	idPrefix="create"
	{form}
	{projects}
	{vendors}
	{activityKategoriList}
	{activityJenisList}
	allowRemoveAttachment={false}
	onSubmit={handleSubmitCreate}
/>

{#if editingActivity}
	<ActivityFormModal
		bind:show={showEditModal}
		title="Edit Aktivitas"
		submitLabel="Update Aktivitas"
		idPrefix="edit"
		{form}
		{projects}
		{vendors}
		{activityKategoriList}
		{activityJenisList}
		allowRemoveAttachment={true}
		onSubmit={handleSubmitUpdate}
	/>
{/if}

<Drawer
	bind:show={showDetailDrawer}
	title="Detail Activity"
	on:close={() => (showDetailDrawer = false)}
>
	<ActivityDetail activity={selectedActivity} />
</Drawer>
