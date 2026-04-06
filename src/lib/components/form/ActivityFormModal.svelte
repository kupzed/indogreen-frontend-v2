<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import FileAttachment from '$lib/components/FileAttachment.svelte';
	import { apiFetch } from '$lib/api';

	export let show: boolean = false;
	export let title: string = 'Form Aktivitas';
	export let submitLabel: string = 'Simpan';
	export let idPrefix: string = 'activity';
	export let allowRemoveAttachment: boolean = true;
	export let showProjectSelect: boolean = true;

	// Update tipe form untuk menyertakan value
	export let form: {
		name: string;
		short_desc: string;
		description: string;
		project_id: string | number | '';
		kategori: string | '';
		value: number; // [Baru] Field value
		activity_date: string | '';
		jenis: string | '';
		mitra_id: number | string | '' | null;
		from?: string | '';
		to?: string | '';
		attachments?: File[];
		attachment_names?: string[];
		attachment_descriptions?: string[];
		existing_attachments?: Array<{
			id: number;
			name: string;
			description?: string;
			url: string;
			size?: number;
			original_name?: string;
		}>;
		removed_existing_ids?: number[];
	};

	// [Baru] Definisi kategori keuangan
	const financeCategories = [
		'Expense Report',
		'Invoice',
		'Invoice & FP',
		'Payment',
		'Faktur Pajak',
		'Kasbon'
	];

	// [Baru] Reactive: Cek kategori & Reset value jika bukan keuangan
	$: showValueInput = form.kategori && financeCategories.includes(form.kategori);
	$: if (!showValueInput) {
		form.value = 0;
	}

	// [Baru] Formatter Preview Rupiah
	$: formattedValuePreview = new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 2
	}).format(form.value || 0);

	const MAX_SHORT_DESC = 80;
	$: shortDescLen = form.short_desc?.length ?? 0;

	export let projects: Array<{ id: number; name: string; mitra?: { id: number; nama: string } }> =
		[];
	export let vendors: Array<{ id: number; nama: string }> = [];
	export let activityKategoriList: string[] = [];
	export let activityJenisList: string[] = [];

	export let onSubmit: () => Promise<void> | void;
	$: selectedProject = projects.find((p) => p.id === Number(form.project_id));

	let isSubmitting = false;

	// ─── AI Auto-Fill State ───────────────────────────────────────────
	let isExtracting = false;
	let aiFileInput: HTMLInputElement;
	let toastMessage = '';
	let toastType: 'success' | 'error' = 'success';
	let toastVisible = false;
	let toastTimer: ReturnType<typeof setTimeout>;

	function showToast(message: string, type: 'success' | 'error' = 'success') {
		clearTimeout(toastTimer);
		toastMessage = message;
		toastType = type;
		toastVisible = true;
		toastTimer = setTimeout(() => {
			toastVisible = false;
		}, 5000);
	}

	function triggerAIFileInput() {
		aiFileInput?.click();
	}

	async function handleAIAutoFill(file: File) {
		if (!file) return;
		isExtracting = true;

		try {
			const formData = new FormData();
			formData.append('action', 'extract');
			formData.append('document', file);
			if (form.project_id) {
				formData.append('project_id', String(form.project_id));
			}

			const response = await apiFetch<{
				data: {
					name?: string;
					short_desc?: string;
					description?: string;
					kategori?: string;
					jenis?: string;
					mitra_id: null;
					value?: number;
					activity_date?: string;
					from?: string;
					to?: string;
				};
			}>('/activities', {
				method: 'POST',
				body: formData,
				auth: true
			});

			const extracted = response?.data;
			if (!extracted) throw new Error('Respons AI tidak valid.');

			// ─── Map AI response → form fields ───────────────────────────
			if (extracted.name) form.name = extracted.name;
			if (extracted.short_desc) form.short_desc = extracted.short_desc.slice(0, MAX_SHORT_DESC);
			if (extracted.description) form.description = extracted.description;
			if (extracted.kategori) form.kategori = extracted.kategori;
			if (extracted.jenis) form.jenis = extracted.jenis;
			if (extracted.value != null) form.value = Number(extracted.value);
			if (extracted.activity_date) form.activity_date = extracted.activity_date;
			if (extracted.from != null) form.from = extracted.from;
			if (extracted.to != null) form.to = extracted.to;
			if (extracted.mitra_id != null) form.mitra_id = extracted.mitra_id;

			form = form;

			showToast(
				'✅ Ekstraksi berhasil, silakan periksa kembali data sebelum menyimpan.',
				'success'
			);
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Ekstraksi gagal. Pastikan file jelas dan coba lagi.';
			showToast(`❌ ${message}`, 'error');
		} finally {
			isExtracting = false;
			// Reset the hidden input so the same file can be re-selected if needed
			if (aiFileInput) aiFileInput.value = '';
		}
	}

	function onAIFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) handleAIAutoFill(file);
	}
	// ─────────────────────────────────────────────────────────────────

	async function handleSubmit() {
		if (isSubmitting) return;
		isSubmitting = true;
		try {
			await onSubmit?.();
		} finally {
			isSubmitting = false;
		}
	}

	function formatFileSize(bytes: number): string {
		if (!bytes) return '';
		const k = 1024,
			sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	}
</script>

<!-- Hidden file input for AI extraction -->
<input
	bind:this={aiFileInput}
	type="file"
	accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
	class="hidden"
	on:change={onAIFileChange}
	aria-hidden="true"
	tabindex="-1"
	id="{idPrefix}_ai_file_input"
/>

<!-- Toast Notification -->
{#if toastVisible}
	<div
		role="alert"
		aria-live="polite"
		class="fixed right-5 bottom-5 z-[9999] max-w-sm rounded-xl px-5 py-3.5 text-sm font-medium shadow-2xl transition-all duration-300
      {toastType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}"
	>
		{toastMessage}
		<button
			type="button"
			class="ml-3 font-bold opacity-70 hover:opacity-100"
			on:click={() => {
				toastVisible = false;
			}}
			aria-label="Tutup notifikasi">&times;</button
		>
	</div>
{/if}

<Modal bind:show {title} maxWidth="max-w-xl">
	{#if form.project_id}
		<div class="mb-4 text-center">
			<div class="text-sm font-semibold">
				Project: <span class="text-violet-700 dark:text-violet-300">{selectedProject?.name}</span>
			</div>
			{#if selectedProject?.mitra?.nama}
				<div class="text-sm">
					Customer: <span class="text-violet-700 dark:text-violet-300"
						>{selectedProject?.mitra?.nama}</span
					>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Auto-Fill via AI Button -->
	<div class="mb-5 flex items-center justify-center">
		<button
			type="button"
			id="{idPrefix}_ai_autofill_btn"
			on:click={triggerAIFileInput}
			disabled={isExtracting || isSubmitting}
			aria-busy={isExtracting}
			class="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm
        font-semibold text-white shadow-md transition-all duration-200
        hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/30
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600
        disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
		>
			{#if isExtracting}
				<!-- Spinner -->
				<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<circle
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-opacity="0.25"
						stroke-width="4"
					></circle>
					<path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4"></path>
				</svg>
				<span>Mengekstrak dokumen...</span>
			{:else}
				<!-- Magic wand icon -->
				<svg
					class="h-4 w-4 transition-transform duration-200 group-hover:rotate-12"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>Auto-Fill with AI</span>
			{/if}
		</button>
	</div>

	{#if isExtracting}
		<!-- Overlay hint while extracting -->
		<div
			class="mb-4 flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-700 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
		>
			<svg
				class="h-4 w-4 shrink-0 animate-pulse"
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fill-rule="evenodd"
					d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>AI sedang menganalisis dokumen Anda. Ini mungkin memerlukan beberapa detik...</span>
		</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit} autocomplete="off" class="space-y-4">
		<fieldset disabled={isSubmitting || isExtracting} class="space-y-4">
			<div>
				<label
					for="{idPrefix}_name"
					class="block text-sm font-medium text-slate-900 dark:text-slate-100">Nama Aktivitas</label
				>
				<input
					id="{idPrefix}_name"
					type="text"
					bind:value={form.name}
					required
					placeholder="Masukkan nama aktivitas"
					class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                 dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
				/>
			</div>

			{#if showProjectSelect}
				<div>
					<label
						for="{idPrefix}_project_id"
						class="block text-sm font-medium text-slate-900 dark:text-slate-100">Project</label
					>
					<select
						id="{idPrefix}_project_id"
						bind:value={form.project_id}
						required
						class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                   px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                   dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
					>
						<option value="">Pilih Project</option>
						{#each projects as project (project.id)}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div>
				<label
					for="{idPrefix}_jenis"
					class="block text-sm font-medium text-slate-900 dark:text-slate-100">Jenis</label
				>
				<select
					id="{idPrefix}_jenis"
					bind:value={form.jenis}
					required
					class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                 dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
				>
					<option value="">Pilih Jenis</option>
					{#each activityJenisList as jenis}<option value={jenis}>{jenis}</option>{/each}
				</select>
				{#if form.jenis === 'Customer'}
					<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
						Customer otomatis berdasarkan Project.
					</p>
				{/if}
			</div>

			{#if form.jenis === 'Vendor'}
				<div>
					<label
						for="{idPrefix}_mitra_id_vendor"
						class="block text-sm font-medium text-slate-900 dark:text-slate-100">Vendor</label
					>
					<select
						id="{idPrefix}_mitra_id_vendor"
						bind:value={form.mitra_id}
						required
						class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                   px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                   dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
					>
						<option value="">Pilih Vendor</option>
						{#each vendors as v (v.id)}<option value={v.id}>{v.nama}</option>{/each}
					</select>
				</div>
			{/if}

			<div>
				<label
					for="{idPrefix}_kategori"
					class="block text-sm font-medium text-slate-900 dark:text-slate-100">Kategori</label
				>
				<select
					id="{idPrefix}_kategori"
					bind:value={form.kategori}
					required
					class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                 dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
				>
					<option value="">Pilih Kategori</option>
					{#each activityKategoriList as k}<option value={k}>{k}</option>{/each}
				</select>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label
						for="{idPrefix}_from"
						class="block text-sm font-medium text-slate-900 dark:text-slate-100"
						>From (Opsional)</label
					>
					<input
						id="{idPrefix}_from"
						bind:value={form.from}
						placeholder="Dari"
						class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                   px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                   dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
					/>
				</div>
				<div>
					<label
						for="{idPrefix}_to"
						class="block text-sm font-medium text-slate-900 dark:text-slate-100"
						>To (Opsional)</label
					>
					<input
						id="{idPrefix}_to"
						bind:value={form.to}
						placeholder="Ke"
						class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                   px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                   dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
					/>
				</div>
			</div>

			<div>
				<label
					for="{idPrefix}_short_desc"
					class="block text-sm font-medium text-slate-900 dark:text-slate-100"
					>Deskripsi Singkat</label
				>
				<div class="relative mt-1">
					<textarea
						id="{idPrefix}_short_desc"
						bind:value={form.short_desc}
						on:input={() => (form.short_desc = (form.short_desc ?? '').slice(0, MAX_SHORT_DESC))}
						rows="2"
						required
						maxlength={MAX_SHORT_DESC}
						placeholder="Deskripsi singkat"
						class="block w-full rounded-md border border-black/10 bg-white/80
                 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                 dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
					></textarea>
					<div class="absolute right-2 bottom-2 text-[10px] text-slate-400">
						{shortDescLen}/{MAX_SHORT_DESC}
					</div>
				</div>
			</div>

			<div>
				<label
					for="{idPrefix}_description"
					class="block text-sm font-medium text-slate-900 dark:text-slate-100">Deskripsi</label
				>
				<textarea
					id="{idPrefix}_description"
					rows="4"
					bind:value={form.description}
					required
					placeholder="Masukkan deskripsi"
					class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                 dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
				></textarea>
			</div>

			{#if showValueInput}
				<div
					class="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 transition-all duration-300 dark:border-emerald-800/30 dark:bg-emerald-900/10"
				>
					<label
						for="{idPrefix}_value"
						class="mb-1 block text-sm font-medium text-emerald-800 dark:text-emerald-400"
						>Nilai / Value (Rp)</label
					>
					<input
						id="{idPrefix}_value"
						type="number"
						step="0.01"
						min="0"
						bind:value={form.value}
						class="block w-full rounded-md border border-emerald-200 bg-white/80
                   px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500
                   focus:outline-none dark:border-emerald-800 dark:bg-[#0e0c19]/80 dark:text-slate-100"
						placeholder="0.00"
						required={showValueInput}
					/>
					<div class="mt-2 flex items-start justify-between text-xs">
						<span class="text-emerald-600 dark:text-emerald-500">Wajib diisi (Angka).</span>
						<span class="font-semibold text-emerald-700 dark:text-emerald-400"
							>Terbaca: {formattedValuePreview}</span
						>
					</div>
				</div>
			{/if}

			<div>
				<label
					for="{idPrefix}_activity_date"
					class="block text-sm font-medium text-slate-900 dark:text-slate-100"
					>Tanggal Aktivitas</label
				>
				<input
					type="date"
					id="{idPrefix}_activity_date"
					bind:value={form.activity_date}
					required
					class="mt-1 block w-full rounded-md border border-black/10 bg-white/80
                 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none
                 dark:border-white/10 dark:bg-[#0e0c19]/80 dark:text-slate-100"
				/>
			</div>

			<FileAttachment
				id="{idPrefix}_attachments"
				label="Lampiran"
				bind:files={form.attachments}
				bind:fileNames={form.attachment_names}
				bind:fileDescriptions={form.attachment_descriptions}
				maxFiles={10}
				showRemoveButton={allowRemoveAttachment}
			/>

			{#if form.existing_attachments?.length}
				<div class="mt-3 space-y-3">
					<p class="text-sm font-medium">Lampiran Lama</p>
					{#each form.existing_attachments as att (att.id)}
						<div
							class="space-y-2 rounded-xl border border-black/5 bg-white/70 p-3 dark:border-white/10 dark:bg-[#12101d]/70"
						>
							<a
								class="truncate text-violet-700 hover:underline dark:text-violet-300"
								href={att.url}
								target="_blank"
								rel="noreferrer"
							>
								{att.original_name ?? att.name}
							</a>
							<input
								type="text"
								bind:value={att.name}
								required
								class="w-full rounded-md border border-black/10 bg-white/80 px-2 py-1 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none dark:border-white/10 dark:bg-[#0e0c19]/80"
							/>
							<input
								type="text"
								bind:value={att.description}
								required
								class="w-full rounded-md border border-black/10 bg-white/80 px-2 py-1 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none dark:border-white/10 dark:bg-[#0e0c19]/80"
							/>
							<div class="flex items-center justify-end gap-3 text-xs">
								{#if att.size}<span class="text-slate-500 dark:text-slate-400"
										>{formatFileSize(att.size)}</span
									>{/if}
								<button
									type="button"
									class="text-rose-600 hover:text-rose-700"
									on:click={() => {
										form.removed_existing_ids = [...(form.removed_existing_ids ?? []), att.id];
										form.existing_attachments = form.existing_attachments!.filter(
											(x) => x.id !== att.id
										);
									}}>Hapus</button
								>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</fieldset>

		<div class="pt-2">
			<button
				type="submit"
				class="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white
               hover:bg-violet-700 focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-60"
				disabled={isSubmitting || isExtracting}
				aria-busy={isSubmitting}
			>
				{#if isSubmitting}
					<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"
						><circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-opacity="0.25"
							stroke-width="4"
						/><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4" /></svg
					>
					<span>Menyimpan...</span>
				{:else}
					{submitLabel}
				{/if}
			</button>
		</div>
	</form>
</Modal>

<style>
	:global(.break-all) {
		word-break: break-all;
		overflow-wrap: anywhere;
	}
	/* Styling untuk input number */
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		appearance: textfield;
		-moz-appearance: textfield;
	}
</style>
