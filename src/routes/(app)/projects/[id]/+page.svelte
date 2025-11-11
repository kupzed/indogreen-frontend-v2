<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, getToken } from '$lib/api';

  import Drawer from '$lib/components/Drawer.svelte';
  import ActivityDetail from '$lib/components/detail/ActivityDetail.svelte';
  import ProjectDetail from '$lib/components/detail/ProjectDetail.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import CertificatesDetail from '$lib/components/detail/CertificatesDetail.svelte';
  import CertificateFormModal from '$lib/components/form/CertificateFormModal.svelte';
  import ActivityFormModal from '$lib/components/form/ActivityFormModal.svelte';
  import ProjectFormModal from '$lib/components/form/ProjectFormModal.svelte';

  import ActivityFilterDesktop from '$lib/components/filters/ActivityFilterDesktop.svelte';
  import ActivityFilterMobile  from '$lib/components/filters/ActivityFilterMobile.svelte';
  import CertificateFilterDesktop from '$lib/components/filters/CertificateFilterDesktop.svelte';
  import CertificateFilterMobile  from '$lib/components/filters/CertificateFilterMobile.svelte';

  let projectId: string | any = null;
  let project: any = null;

  // Activities
  let activities: any[] = [];
  let loadingActivities = true;
  let errorActivities = '';
  let activitiesInitialized = false;

  // Project
  let loadingProject = true;
  let errorProject = '';

  // Lists (vendors/customers untuk form)
  let customers: any[] = [];
  let vendors: any[] = [];

  // ===== Helpers =====
  function qs(obj: Record<string, any>) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) p.set(k, String(v));
    });
    return p.toString();
  }

  function getStatusBadgeClasses(status: string) {
    switch ((status || '').toLowerCase()) {
      case 'complete':  return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300';
      case 'ongoing':   return 'bg-blue-500/20 text-blue-600 dark:text-blue-300';
      case 'prospect':  return 'bg-amber-500/20 text-amber-600 dark:text-amber-300';
      case 'cancel':    return 'bg-rose-500/20 text-rose-600 dark:text-rose-300';
      default:          return 'bg-slate-500/20 text-slate-600 dark:text-slate-300';
    }
  }

  // ===== Fetch Project =====
  async function fetchProjectDetails() {
    loadingProject = true;
    errorProject = '';
    projectId = $page.params.id;
    if (!projectId) { errorProject = 'Project ID tidak ditemukan.'; loadingProject = false; return; }

    try {
      const res: any = await apiFetch(`/projects/${projectId}`, { auth: true });
      const data = res?.data ?? res ?? {};
      project = data.project ?? data;

      // Sinkronkan form edit awal
      editProjectForm = {
        name: project?.name ?? '',
        description: project?.description ?? '',
        status: project?.status ?? '',
        start_date: project?.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
        finish_date: project?.finish_date ? new Date(project.finish_date).toISOString().split('T')[0] : '',
        mitra_id: project?.mitra_id || '',
        kategori: project?.kategori || '',
        lokasi: project?.lokasi || '',
        no_po: project?.no_po || '',
        no_so: project?.no_so || '',
        is_cert_projects: !!project?.is_cert_projects,
      };

      // Default form create activity
      createActivityForm.project_id = project.id;
      if (project.mitra && project.mitra.is_customer) {
        createActivityForm.mitra_id = project.mitra.id;
        createActivityForm.jenis = 'Customer';
      } else {
        createActivityForm.jenis = '';
      }
    } catch (err: any) {
      errorProject = err?.message || 'Gagal memuat proyek.';
    } finally {
      loadingProject = false;
    }
  }

  // ===== Layout: Sidebar & Mobile filter =====
  let showSidebar = true;
  let showMobileFilter = false;
  function toggleFilter() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      showMobileFilter = true;
    } else {
      showSidebar = !showSidebar;
    }
  }

  // ===== Fetch Activities (list dalam project) =====
  // Filter/search state
  let activityJenisFilter = '';
  let activityKategoriFilter = '';
  let activitySearch = '';
  let activityDateFromFilter = '';
  let activityDateToFilter = '';
  let showActivityDateFilter = false;

  // ===== Activity: chips untuk filter aktif =====
  let activityFilterChips: Array<{key:string; label:string}> = [];
  $: activityFilterChips = [
    activityJenisFilter && { key:'jenis',   label:`Jenis: ${activityJenisFilter}` },
    activityVendorFilter && activityJenisFilter==='Vendor' && { key:'vendor',  label:`Vendor: ${projectVendorOptions.find(v=>v.id==activityVendorFilter)?.nama ?? '-'}` },
    activityKategoriFilter && { key:'kategori', label:`Kategori: ${activityKategoriFilter}` },
    (activityDateFromFilter || activityDateToFilter) && { key:'date', label: `Tanggal: ${activityDateFromFilter?new Date(activityDateFromFilter).toLocaleDateString('id-ID'):'...'} - ${activityDateToFilter?new Date(certificateDateToFilter||activityDateToFilter).toLocaleDateString('id-ID'):'...'}` },
    activitySearch && { key:'search', label:`Cari: ${activitySearch}` },
  ].filter(Boolean) as any;

  function clearOneActivityFilter(key:string){
    if (key==='jenis'){ activityJenisFilter=''; activityVendorFilter=''; }
    if (key==='vendor'){ activityVendorFilter=''; }
    if (key==='kategori'){ activityKategoriFilter=''; }
    if (key==='date'){ activityDateFromFilter=''; activityDateToFilter=''; }
    if (key==='search'){ activitySearch=''; }
    handleActivityFilterOrSearch();
  }
  function clearAllActivityFilters(){
    clearActivityFilters();
    activitySearch = '';
  }

  // Vendor filter
  $: if (activityJenisFilter !== 'Vendor') {
    activityVendorFilter = '';
  }

  // Paging
  let activityCurrentPage = 1;
  let activityLastPage = 1;
  let totalActivities = 0;
  let activityPerPage = 50;
  const perPageOptions = [10, 25, 50, 100];

  async function fetchActivities() {
    loadingActivities = true;
    errorActivities = '';
    try {
      const pid = project?.id ?? $page.params.id;
      if (!pid) { errorActivities = 'Project ID tidak ditemukan.'; return; }

      const url = `/projects/${pid}?${qs({
        jenis: activityJenisFilter,
        kategori: activityKategoriFilter,
        mitra_id: activityJenisFilter === 'Vendor' && activityVendorFilter ? activityVendorFilter : undefined,
        search: activitySearch,
        date_from: activityDateFromFilter,
        date_to: activityDateToFilter,
        page: activityCurrentPage,
        per_page: activityPerPage
      })}`;

      const res: any = await apiFetch(url, { auth: true });
      const data = res?.data ?? res ?? {};
      activities = data.activities ?? [];

      activityCurrentPage = data.activity_pagination?.current_page ?? 1;
      activityLastPage    = data.activity_pagination?.last_page   ?? 1;
      totalActivities     = data.activity_pagination?.total       ?? (Array.isArray(activities) ? activities.length : 0);
      projectVendorOptions = Array.isArray(data.vendor_options) ? data.vendor_options : [];
    } catch (err: any) {
      errorActivities = err?.message || 'Gagal memuat aktivitas.';
    } finally {
      loadingActivities = false;
    }
  }

  function goToActivityPage(p: number) { if (p > 0 && p <= activityLastPage) { activityCurrentPage = p; fetchActivities(); } }
  function handleActivityFilterOrSearch() { activityCurrentPage = 1; fetchActivities(); }
  function clearActivityFilters() {
    activityJenisFilter = '';
    activityKategoriFilter = '';
    activityVendorFilter = '';
    activitySearch = '';
    activityDateFromFilter = '';
    activityDateToFilter = '';
    activityCurrentPage = 1;
    fetchActivities();
  }
  function toggleActivityDateFilter() { showActivityDateFilter = !showActivityDateFilter; }
  function handleActivityDateFilter() { activityCurrentPage = 1; fetchActivities(); }

  // Click outside untuk dropdown
  function handleClickOutside(event: MouseEvent) {
    const t = event.target as HTMLElement;
    if (!t.closest('.date-filter-dropdown')) showActivityDateFilter = false;
    if (!t.closest('.certificate-date-filter-dropdown') && !t.closest('.certificate-date-filter-button')) {
      showCertificateDateFilter = false;
    }
  }

  // ===== Dependencies untuk form =====
  async function fetchFormDependencies() {
    try {
      const vendorsRes: any = await apiFetch('/mitra/vendors', { auth: true });
      vendors = vendorsRes?.data ?? vendorsRes ?? [];

      const customersRes: any = await apiFetch('/mitra/customers', { auth: true });
      customers = customersRes?.data ?? customersRes ?? [];
    } catch (err) {
      console.error('Failed to fetch form dependencies:', err);
    }
  }

  onMount(() => {
    if (!getToken()) { goto('/auth/login'); return; }
    fetchProjectDetails();
    fetchActivities();
    fetchFormDependencies();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  // Vendor filter state
  let activityVendorFilter: number | string = '';
  let projectVendorOptions: Array<{ id: number; nama: string }> = [];

  // ===== Edit Project =====
  let showEditProjectModal = false;
  let editProjectForm = {
    name: '', description: '', status: '',
    start_date: '', finish_date: '',
    mitra_id: '', kategori: '', lokasi: '',
    no_po: '', no_so: '', is_cert_projects: false,
  };
  const projectStatuses = ['Ongoing', 'Prospect', 'Complete', 'Cancel'];
  const projectKategoris = ['PLTS Hybrid','PLTS Ongrid','PLTS Offgrid','PJUTS All In One','PJUTS Two In One','PJUTS Konvensional'];

  function openEditProjectModal() { showEditProjectModal = true; }
  async function handleSubmitUpdateProject() {
    if (!project?.id) return;
    try {
      await apiFetch(`/projects/${project.id}`, { method: 'PUT', body: editProjectForm, auth: true });
      alert('Proyek berhasil diperbarui!');
      goto(`/projects/${project.id}`);
      showEditProjectModal = false;
      fetchProjectDetails();
    } catch (err: any) {
      alert('Error:\n' + (err?.message || 'Gagal memperbarui proyek.'));
    }
  }
  async function handleDeleteProject() {
    if (!project?.id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus proyek ini?')) return;
    try {
      await apiFetch(`/projects/${project.id}`, { method: 'DELETE', auth: true });
      alert('Proyek berhasil dihapus!');
      goto('/projects');
    } catch (err: any) {
      alert('Gagal menghapus proyek: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  // ===== Create / Edit Activity =====
  let showCreateActivityModal = false;
  let createActivityForm = {
    name: '', short_desc: '', description: '', project_id: '',
    kategori: '', activity_date: '',
    attachment: null as File | null,
    jenis: '', mitra_id: null as string | null,
    from: '', to: '',
  };
  let createActivityFileName = '';

  let showEditActivityModal = false;
  let showActivityDetailDrawer = false;
  let selectedActivity: any = null;
  let editingActivity: any = null;
  type ExistingAtt = {
    id: number;
    name: string;
    description?: string;
    original_name?: string;
    url: string;
    size?: number;
  };

  let editActivityForm: {
    name: string;
    short_desc: string;
    description: string;
    project_id: string | number | '';
    kategori: string | '';
    activity_date: string | '';
    jenis: string | '';
    mitra_id: number | string | '' | null;
    from?: string | '';
    to?: string | '';
    // multi + existing
    attachments: File[];
    attachment_names: string[];
    attachment_descriptions: string[];
    existing_attachments: ExistingAtt[];
    removed_existing_ids: number[];
  } = {
    name: '', short_desc: '', description: '', project_id: '', kategori: '', activity_date: '',
    jenis: '', mitra_id: '', from: '', to: '',
    attachments: [], attachment_names: [], attachment_descriptions: [],
    existing_attachments: [], removed_existing_ids: []
  };

  let editActivityFileName = '';

  function openCreateActivityModal() {
    createActivityForm = {
      name: '', short_desc: '', description: '', project_id: project.id,
      kategori: '', activity_date: '', attachment: null,
      jenis: project.mitra && project.mitra.is_customer ? 'Customer' : '',
      mitra_id: project.mitra && project.mitra.is_customer ? project.mitra.id : null,
      from: '', to: '',
    };
    createActivityFileName = '';
    showCreateActivityModal = true;
  }
  function openEditActivityModal(activity: any) {
    editingActivity = { ...activity };
    editActivityForm = {
      name: activity?.name ?? '',
      short_desc: activity?.short_desc ?? '',
      description: activity?.description ?? '',
      project_id: activity?.project_id ?? project?.id ?? '',
      kategori: activity?.kategori ?? '',
      activity_date: activity?.activity_date ? new Date(activity.activity_date).toISOString().split('T')[0] : '',
      jenis: activity?.jenis ?? '',
      mitra_id: activity?.mitra_id ?? '',
      from: activity?.from ?? '',
      to: activity?.to ?? '',
      attachments: [],
      attachment_names: [],
      attachment_descriptions: [],
      existing_attachments: Array.isArray(activity?.attachments)
        ? activity.attachments.map((a: any) => ({
            id: a.id,
            name: a.name ?? a.file_name ?? 'Lampiran',
            description: a.description ?? '',
            original_name: a.original_name ?? a.file_name ?? a.name ?? '',
            url: a.url ?? a.path ?? a.file_path,
            size: a.size
          }))
        : [],
      removed_existing_ids: []
    };
    showEditActivityModal = true;
  }

  function buildFormDataForActivity(form: typeof editActivityForm | typeof createActivityForm) {
    const fd = new FormData();

    const appendScalar = (k: string, v: any) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v)); };

    appendScalar('name', (form as any).name);
    appendScalar('short_desc', (form as any).short_desc);
    appendScalar('description', (form as any).description);
    appendScalar('project_id', (form as any).project_id);
    appendScalar('kategori', (form as any).kategori);
    appendScalar('activity_date', (form as any).activity_date);
    appendScalar('jenis', (form as any).jenis);
    appendScalar('from', (form as any).from);
    appendScalar('to', (form as any).to);

    // mitra rules
    if ((form as any).jenis === 'Internal')      fd.set('mitra_id', '1');
    else if ((form as any).jenis === 'Customer') fd.set('mitra_id', String(project?.mitra_id ?? ''));
    else if ((form as any).jenis === 'Vendor' && (form as any).mitra_id) fd.set('mitra_id', String((form as any).mitra_id));

    // New uploads
    (form as any).attachments?.forEach((file: File, i: number) => fd.append(`attachments[${i}]`, file));
    (form as any).attachment_names?.forEach((n: string, i: number) => n != null && fd.append(`attachment_names[${i}]`, n));
    (form as any).attachment_descriptions?.forEach((d: string, i: number) => d != null && fd.append(`attachment_descriptions[${i}]`, d));

    // Existing
    (form as any).existing_attachments?.forEach((att: any, i: number) => {
      fd.append(`existing_attachment_ids[${i}]`, String(att.id));
      fd.append(`existing_attachment_names[${i}]`, att.name ?? '');
      fd.append(`existing_attachment_descriptions[${i}]`, att.description ?? '');
    });

    // Removed
    (form as any).removed_existing_ids?.forEach((rid: number) => fd.append('removed_existing_ids[]', String(rid)));

    return fd;
  }

  function openActivityDetailDrawer(activity: any) { selectedActivity = { ...activity }; showActivityDetailDrawer = true; }

  function buildFD(obj: Record<string, any>) {
    const fd = new FormData();

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null || value === '') continue;
      if (key === 'attachment_removed') continue; // kita set manual saat edit

      // Jika array (string[] | File[]), kirim sebagai key[]
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null && v !== '') {
            fd.append(`${key}[]`, v as any);
          }
        });
        continue;
      }

      fd.append(key, value as any);
    }

    return fd;
  }

  function normalizeActivityPayload(f: any) {
    const p = { ...f };

    // Backward compat: kalau masih single field, ubah jadi array
    if (!Array.isArray(p.attachments) && p.attachment) {
      p.attachments = [p.attachment];
    }
    if (!Array.isArray(p.attachment_names) && p.attachment_name) {
      p.attachment_names = [p.attachment_name];
    }

    // Alias umum dari komponen form
    if (!p.attachments && Array.isArray(p.files)) p.attachments = p.files;
    if (!p.attachment_names && Array.isArray(p.file_names)) p.attachment_names = p.file_names;

    return p;
  }

  async function handleSubmitCreateActivity() {
    try {
      const fd = buildFormDataForActivity(createActivityForm as any);
      await apiFetch('/activities', { method: 'POST', body: fd, auth: true });
      alert('Aktivitas berhasil ditambahkan!');
      showCreateActivityModal = false;
      fetchActivities();
    } catch (err: any) {
      alert('Error:\n' + (err?.message || 'Gagal menambahkan aktivitas.'));
    }
  }

  async function handleSubmitUpdateActivity() {
    if (!editingActivity?.id) return;
    try {
      const fd = buildFormDataForActivity(editActivityForm as any);
      fd.append('_method', 'PUT');
      await apiFetch(`/activities/${editingActivity.id}`, { method: 'POST', body: fd, auth: true });
      alert('Aktivitas berhasil diperbarui!');
      showEditActivityModal = false;
      fetchActivities();
    } catch (err: any) {
      alert('Error:\n' + (err?.message || 'Gagal memperbarui aktivitas.'));
    }
  }

  async function handleDeleteActivity(activityId: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) return;
    try {
      await apiFetch(`/activities/${activityId}`, { method: 'DELETE', auth: true });
      alert('Aktivitas berhasil dihapus!');
      goto(`/projects/${project.id}`);
      fetchActivities();
    } catch (err: any) {
      alert('Gagal menghapus aktivitas: ' + (err?.message || 'Terjadi kesalahan'));
    }
  }

  // Sinkronisasi pilihan jenis → mitra_id
  let previousCreateActivityJenis = '';
  $: if (showCreateActivityModal && createActivityForm.jenis && createActivityForm.jenis !== previousCreateActivityJenis) {
    previousCreateActivityJenis = createActivityForm.jenis;
    if (createActivityForm.jenis === 'Customer')      createActivityForm.mitra_id = project?.mitra_id || null;
    else if (createActivityForm.jenis === 'Internal') createActivityForm.mitra_id = '1';
    else if (createActivityForm.jenis === 'Vendor')   { if (!Array.isArray(vendors) || !vendors.some(v => v.id == createActivityForm.mitra_id)) createActivityForm.mitra_id = ''; }
    else                                              createActivityForm.mitra_id = '';
  }
  $: if (!showCreateActivityModal) { createActivityForm.mitra_id = ''; createActivityForm.jenis = ''; previousCreateActivityJenis = ''; }

  // List referensi
  const activityKategoriList = ['Expense Report','Invoice','Purchase Order','Payment','Quotation','Faktur Pajak','Kasbon','Laporan Teknis','Surat Masuk','Surat Keluar','Kontrak'];
  const activityJenisList = ['Internal','Customer','Vendor'];

  // Switch List/Table
  let activeTab: 'detail' | 'activity' | 'certificates' = 'activity';
  let activityView: 'table' | 'list' = 'table';
  const activityViews: Array<'table' | 'list'> = ['table', 'list'];
  function handleActivityViewKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      let idx = activityViews.indexOf(activityView);
      idx = e.key === 'ArrowRight' ? (idx + 1) % activityViews.length : (idx - 1 + activityViews.length) % activityViews.length;
      activityView = activityViews[idx];
    }
  }

  // ===== Certificates =====
  type Option = { id: number; name?: string; nama?: string; title?: string; no_seri?: string };
  type ProjectCertificate = {
    id: number; name: string; no_certificate: string;
    status: 'Belum' | 'Tidak Aktif' | 'Aktif';
    date_of_issue: string; date_of_expired: string;
    attachment?: string | null; barang_certificate?: { id: number; name: string } | null;
  };
  let certificates: ProjectCertificate[] = [];
  let loadingCertificates = false;
  let errorCertificates = '';
  let certificateSearch = '';
  let certificateStatusFilter: '' | ProjectCertificate['status'] = '';
  // ===== Certificates: chips untuk filter aktif =====
  let certificateFilterChips: Array<{key:string; label:string}> = [];
  $: certificateFilterChips = [
    certificateStatusFilter && { key:'status', label:`Status: ${certificateStatusFilter}` },
    (certificateDateFromFilter || certificateDateToFilter) && { key:'date', label:`Terbit: ${certificateDateFromFilter?new Date(certificateDateFromFilter).toLocaleDateString('id-ID'):'...'} - ${certificateDateToFilter?new Date(certificateDateToFilter).toLocaleDateString('id-ID'):'...'}` },
    certificateSearch && { key:'search', label:`Cari: ${certificateSearch}` },
  ].filter(Boolean) as any;

  function clearOneCertificateFilter(key:string){
    if (key==='status'){ certificateStatusFilter=''; }
    if (key==='date'){ certificateDateFromFilter=''; certificateDateToFilter=''; }
    if (key==='search'){ certificateSearch=''; }
    handleCertificateFilterOrSearch();
  }
  function clearAllCertificateFilters(){
    certificateDateFromFilter=''; certificateDateToFilter='';
    certificateStatusFilter=''; certificateSearch='';
    handleCertificateFilterOrSearch();
  }
  let certificateCurrentPage = 1;
  let certificateLastPage = 1;
  let totalCertificates = 0;
  let certificatesInitialized = false;
  let certificateDependenciesInitialized = false;
  const certificateStatuses = ['Belum','Tidak Aktif','Aktif'] as const;
  let certificateBarangOptions: Option[] = [];

  function getCertificateStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Aktif': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300';
      case 'Tidak Aktif': return 'bg-rose-500/20 text-rose-600 dark:text-rose-300';
      case 'Belum': return 'bg-amber-500/20 text-amber-600 dark:text-amber-300';
      default: return 'bg-slate-500/20 text-slate-600 dark:text-slate-300';
    }
  }

  async function fetchCertificateDependencies() {
    if (!project?.id) return;
    try {
      const res: any = await apiFetch(`/certificate/getBarangCertificatesByProject/${project.id}`, { auth: true });
      certificateBarangOptions = res?.data ?? res ?? [];
    } catch (err) {
      console.error('Failed to fetch certificate dependencies', err);
      certificateBarangOptions = [];
    }
  }

  async function fetchCertificates() {
    if (!project?.id) return;
    loadingCertificates = true; errorCertificates = '';
    try {
      const url = `/certificates?${qs({
        project_id: project.id,
        search: certificateSearch,
        status: certificateStatusFilter,
        date_from: certificateDateFromFilter,
        date_to: certificateDateToFilter,
        page: certificateCurrentPage,
        per_page: certificatePerPage
      })}`;
      const res: any = await apiFetch(url, { auth: true });
      certificates           = res?.data ?? res?.items ?? res ?? [];
      certificateCurrentPage = res?.pagination?.current_page ?? res?.current_page ?? 1;
      certificateLastPage    = res?.pagination?.last_page   ?? res?.last_page   ?? 1;
      totalCertificates      = res?.pagination?.total       ?? res?.total       ?? (Array.isArray(certificates) ? certificates.length : 0);
    } catch (err: any) { errorCertificates = err?.message || 'Gagal memuat sertifikat.'; }
    finally { loadingCertificates = false; }
  }

  function handleCertificateSearchChange() { certificateCurrentPage = 1; fetchCertificates(); }
  function goToCertificatePage(p: number) { if (p > 0 && p <= certificateLastPage) { certificateCurrentPage = p; fetchCertificates(); } }
  function handleCertificateFilterOrSearch() { certificateCurrentPage = 1; fetchCertificates(); }

  let certificateView: 'table' | 'list' = 'table';
  const certificateViews: Array<'table' | 'list'> = ['table', 'list'];
  function handleCertificateViewKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      let idx = certificateViews.indexOf(certificateView);
      idx = e.key === 'ArrowRight' ? (idx + 1) % certificateViews.length : (idx - 1 + certificateViews.length) % certificateViews.length;
      certificateView = certificateViews[idx];
    }
  }

  let certificateDateFromFilter = '';
  let certificateDateToFilter = '';
  let showCertificateDateFilter = false;
  function toggleCertificateDateFilter() { showCertificateDateFilter = !showCertificateDateFilter; }
  function handleCertificateDateFilter() { certificateCurrentPage = 1; fetchCertificates(); }

  // Trigger tab init
  $: if (activeTab === 'activity' && project?.id && !activitiesInitialized) { activitiesInitialized = true; fetchActivities(); }
  $: if (activeTab === 'certificates' && project && !project.is_cert_projects) { activeTab = 'detail'; }
  $: if (activeTab === 'certificates' && project?.id && !certificatesInitialized) {
    certificatesInitialized = true; fetchCertificates();
    if (!certificateDependenciesInitialized) { certificateDependenciesInitialized = true; fetchCertificateDependencies(); }
  }

  // Certificate form state
  let certificateForm: any;
  let showCreateCertificateModal = false;
  let showEditCertificateModal = false;
  let showCertificateDetailDrawer = false;
  let editingCertificate: ProjectCertificate | null = null;
  let selectedCertificate: ProjectCertificate | null = null;
  let certificateFormFileName = '';
  let certificatePerPage = 50;

  function openCreateCertificateModal() {
    certificateForm = {
      name: '', no_certificate: '', project_id: project?.id ?? '',
      barang_certificate_id: '', status: '',
      date_of_issue: '', date_of_expired: '',
      attachments: [] as File[],
      attachment_names: [] as string[],
      attachment_descriptions: [] as string[],
      existing_attachments: [] as any[],
      removed_existing_ids: [] as number[],
    };
    showCreateCertificateModal = true;
  }

  function openEditCertificateModal(item: ProjectCertificate) {
    editingCertificate = { ...item };
    certificateForm = {
      name: item?.name ?? '',
      no_certificate: item?.no_certificate ?? '',
      project_id: project?.id ?? '',
      barang_certificate_id: item?.barang_certificate?.id ?? '',
      status: item?.status ?? '',
      date_of_issue: item?.date_of_issue ? new Date(item.date_of_issue).toISOString().split('T')[0] : '',
      date_of_expired: item?.date_of_expired ? new Date(item.date_of_expired).toISOString().split('T')[0] : '',
      attachments: [],
      attachment_names: [],
      attachment_descriptions: [],
      existing_attachments: Array.isArray((item as any)?.attachments)
        ? (item as any).attachments.map((a: any) => ({
            id: a.id,
            name: a.name ?? a.file_name ?? 'Lampiran',
            description: a.description ?? '',
            original_name: a.original_name ?? a.file_name ?? a.name ?? '',
            url: a.url ?? a.path ?? a.file_path,
            size: a.size
          }))
        : [],
      removed_existing_ids: []
    };
    showEditCertificateModal = true;
  }

  function openCertificateDetailDrawer(item: ProjectCertificate) { selectedCertificate = { ...item }; showCertificateDetailDrawer = true; }

  function buildCertificateFormData() {
    const fd = new FormData();
    const f = certificateForm ?? {};
    const put = (k: string, v: any) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v)); };

    // fields dasar
    put('name', f.name);
    put('no_certificate', f.no_certificate);
    if (project?.id) put('project_id', project.id);
    put('barang_certificate_id', f.barang_certificate_id);
    put('status', f.status);
    put('date_of_issue', f.date_of_issue);
    put('date_of_expired', f.date_of_expired);

    // uploads baru
    (f.attachments || []).forEach((file: File, i: number) => fd.append(`attachments[${i}]`, file));
    (f.attachment_names || []).forEach((n: string, i: number) => n != null && fd.append(`attachment_names[${i}]`, n));
    (f.attachment_descriptions || []).forEach((d: string, i: number) => d != null && fd.append(`attachment_descriptions[${i}]`, d));

    // existing (agar lampiran lama tampil & bisa update nama/desc)
    (f.existing_attachments || []).forEach((att: any, i: number) => {
      fd.append(`existing_attachment_ids[${i}]`, String(att.id));
      fd.append(`existing_attachment_names[${i}]`, att.name ?? '');
      fd.append(`existing_attachment_descriptions[${i}]`, att.description ?? '');
    });

    // removed (jika user hapus lampiran lama di form)
    (f.removed_existing_ids || []).forEach((rid: number) => fd.append('removed_existing_ids[]', String(rid)));

    return fd;
  }


  async function handleSubmitCreateCertificate() {
    try {
      const fd = buildCertificateFormData();
      await apiFetch('/certificates', { method: 'POST', body: fd, auth: true });
      alert('Certificate berhasil ditambahkan');
      showCreateCertificateModal = false;
      fetchCertificates();
    } catch (err: any) {
      alert('Error:\n' + (err?.message || 'Gagal menambahkan data.'));
    }
  }

  async function handleSubmitUpdateCertificate() {
    if (!editingCertificate?.id) return;
    try {
      const fd = buildCertificateFormData();
      fd.append('_method', 'PUT');
      await apiFetch(`/certificates/${editingCertificate.id}`, { method: 'POST', body: fd, auth: true });
      alert('Certificate berhasil diperbarui');
      showEditCertificateModal = false;
      fetchCertificates();
    } catch (err: any) {
      alert('Error:\n' + (err?.message || 'Gagal memperbarui data.'));
    }
  }

  async function handleDeleteCertificate(id: number) {
    if (!confirm('Yakin ingin menghapus certificate ini?')) return;
    try {
      await apiFetch(`/certificates/${id}`, { method: 'DELETE', auth: true });
      alert('Certificate berhasil dihapus');
      fetchCertificates();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err?.message || 'Terjadi kesalahan'));
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
  $: lockBodyScroll(showEditProjectModal || showActivityDetailDrawer || 
  showCreateActivityModal || showEditActivityModal || showMobileFilter ||
  showCertificateDetailDrawer || showCreateCertificateModal || showEditCertificateModal);
</script>

<svelte:head>
  <title>Detail Project - Indogreen</title>
</svelte:head>

{#if loadingProject}
  <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]" role="status" aria-busy="true">
    <!-- Header skeleton -->
    <div class="py-3">
      <div class="flex justify-between items-start gap-4">
        <div class="flex-1 min-w-0">
          <div class="h-7 w-64 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
          <div class="my-2 flex flex-wrap gap-3">
            <div class="h-4 w-52 rounded-md bg-slate-200/60 dark:bg-white/10 animate-pulse"></div>
            <span class="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/10 animate-pulse"></span>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 shrink-0">
          <div class="h-9 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
          <div class="h-9 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Tabs skeleton -->
    <div class="py-3">
      <div class="inline-flex rounded-2xl p-1 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10">
        <div class="h-8 w-20 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
        <div class="ml-1 h-8 w-24 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
        <div class="ml-1 h-8 w-28 rounded-xl bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
      </div>
    </div>

    <!-- Panel skeleton singkat -->
    <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#12101d]/60 backdrop-blur shadow-sm p-6">
      <div class="h-5 w-40 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
      <div class="mt-4 space-y-3">
        {#each Array(5) as _}
          <div class="h-10 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"></div>
        {/each}
      </div>
    </div>
  </section>
{:else if errorProject}
  <p class="text-rose-500">{errorProject}</p>
{:else if project}
  <div class="mx-auto mb-8">
    <!-- ====== LAYOUT ala Detail Mitra: Sticky Header + Tabs + (conditional) Action Bar ====== -->
    <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]">
      <div>
        <!-- Header -->
        <div class="py-3">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100">{project.name}</h2>
              <div class="my-2 flex flex-wrap gap-3">
                <div class="flex items-center text-sm text-slate-500 dark:text-slate-300">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  Mulai: {project?.start_date ? new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                </div>
                <div class="my-2 flex items-center text-sm">
                  <span class={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClasses(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 shrink-0">
              <button on:click={openEditProjectModal}
                class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm">Edit Project</button>
              <button on:click={handleDeleteProject}
                class="px-4 h-9 rounded-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm">Hapus Project</button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="py-3">
          <div class="inline-flex rounded-2xl p-1 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10" role="tablist" aria-label="Project tabs">
            <button
              on:click={() => (activeTab = 'detail')}
              class="px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300"
              class:bg-white={activeTab === 'detail'}
              class:dark:bg-violet-900={activeTab === 'detail'}
              class:text-violet-800={activeTab === 'detail'}
              class:dark:text-white={activeTab === 'detail'}
            >Detail</button>
            <button
              on:click={() => (activeTab = 'activity')}
              class="px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300"
              class:bg-white={activeTab === 'activity'}
              class:dark:bg-violet-900={activeTab === 'activity'}
              class:text-violet-800={activeTab === 'activity'}
              class:dark:text-white={activeTab === 'activity'}
            >Activity</button>
            {#if project?.is_cert_projects}
              <button
                on:click={() => (activeTab = 'certificates')}
                class="px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300"
                class:bg-white={activeTab === 'certificates'}
                class:dark:bg-violet-900={activeTab === 'certificates'}
                class:text-violet-800={activeTab === 'certificates'}
                class:dark:text-white={activeTab === 'certificates'}
              >Certificate</button>
            {/if}
          </div>
        </div>

        <!-- Action Bar: Detail -->
        {#if activeTab === 'detail'}
          <div class="bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur border border-black/5 dark:border-white/10 shadow-sm overflow-hidden mb-8">
            <div class="px-4 py-5 sm:px-6 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur">
              <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">Informasi Project</h3>
            </div>
            <div class="px-4 py-3 sm:px-6">
              <ProjectDetail project={project} />
            </div>
          </div>
        {/if}

        <!-- Action Bar: Activity -->
        {#if activeTab === 'activity'}
          <div class={"grid grid-cols-1 gap-4 " + (showSidebar ? "lg:grid-cols-[260px_minmax(0,1fr)]" : "")}>
            <!-- SIDEBAR (desktop) -->
            <!-- svelte-ignore a11y_no_redundant_roles -->
            <aside role="complementary" aria-label="Filter" class={"hidden " + (showSidebar ? "lg:block" : "lg:hidden")}>
              <div class="sticky top-[72px]">
                <div class="max-h[calc(100dvh-72px-48px)] max-h-[calc(100dvh-72px-48px)] overflow-y-auto overscroll-contain no-scrollbar [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]">
                  <ActivityFilterDesktop
                    jenisOptions={activityJenisList}
                    kategoriOptions={activityKategoriList}
                    vendorOptions={projectVendorOptions}
                    jenisValue={activityJenisFilter}
                    kategoriValue={activityKategoriFilter}
                    vendorValue={activityVendorFilter}
                    dateFrom={activityDateFromFilter}
                    dateTo={activityDateToFilter}
                    on:update={(e)=>{ const {key,value}=e.detail; 
                      if(key==='jenis') activityJenisFilter=value; 
                      if(key==='kategori') activityKategoriFilter=value; 
                      if(key==='vendor') activityVendorFilter=value;
                      if(key==='dateFrom') activityDateFromFilter=value; 
                      if(key==='dateTo') activityDateToFilter=value; 
                      handleActivityFilterOrSearch();
                    }}
                    on:clear={() => { clearAllActivityFilters(); }}
                  />
                </div>
              </div>
            </aside>

            <!-- KONTEN KANAN -->
            <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]">
              <!-- STICKY ACTION BAR + CHIPS -->
              <div class="border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10 sticky z-30 top-[60px] sm:top-[72px]">
                <!-- ACTION BAR -->
                <div class="flex items-center gap-2 flex-nowrap bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-2 py-2">
                  <!-- kiri: tombol filter + switch view -->
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      on:click={toggleFilter}
                      class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm
                            border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70
                            text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      aria-label="Filter"
                    >
                      {#if showSidebar}
                        <svg class="w-5 h-5 hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
                        </svg>

                        <svg class="w-5 h-5 lg:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M4 6h16M6 12h12M10 18h4"/>
                        </svg>

                      {:else}
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M4 6h16M6 12h12M10 18h4"/>
                        </svg>
                      {/if}
                      <span class="sr-only">Filter</span>
                    </button>

                    <div class="bg-slate-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-md inline-flex"
                        role="tablist" aria-label="Switch view" tabindex="0" on:keydown={handleActivityViewKeydown}>
                      <button on:click={() => (activityView='table')}
                        class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                        class:bg-white={activityView==='table'} class:dark:bg-[#12101d]={activityView==='table'} class:shadow={activityView==='table'} title="Table">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><line x1="3.5" y1="9"  x2="20.5" y2="9"></line><line x1="3.5" y1="13" x2="20.5" y2="13"></line><line x1="3.5" y1="17" x2="20.5" y2="17"></line></svg>
                        <span class="sr-only">Tampilan Tabel</span>
                      </button>
                      <button on:click={() => (activityView='list')}
                        class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                        class:bg-white={activityView==='list'} class:dark:bg-[#12101d]={activityView==='list'} class:shadow={activityView==='list'} title="List">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="5" cy="6" r="1.3"></circle><circle cx="5" cy="12" r="1.3"></circle><circle cx="5" cy="18" r="1.3"></circle><line x1="9" y1="6"  x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line></svg>
                        <span class="sr-only">Tampilan List</span>
                      </button>
                    </div>
                  </div>

                  <!-- kanan: search + tambah -->
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div class="relative flex-1 min-w-0">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" /></svg>
                      </div>
                      <input type="text" placeholder="Cari aktivitas..." bind:value={activitySearch} on:input={handleActivityFilterOrSearch}
                        class="block w-full pl-10 pr-3 h-9 rounded-md text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 placeholder-slate-500 dark:placeholder-slate-400" />
                    </div>
                    <button on:click={openCreateActivityModal}
                      class="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 grid place-items-center shrink-0"
                      aria-label="Tambah Project" title="Tambah Project">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- CHIPS -->
                {#if activityFilterChips.length}
                  <div class="flex items-center flex-wrap gap-2 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-3 py-2">
                    {#each activityFilterChips as chip}
                      <span class="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 px-3 py-1 text-xs font-medium">
                        {chip.label}
                        <button type="button" aria-label="Hapus filter" class="opacity-70 hover:opacity-100" on:click={() => clearOneActivityFilter(chip.key)}>✕</button>
                      </span>
                    {/each}
                    <button type="button" class="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline" on:click={clearAllActivityFilters}>Clear</button>
                  </div>
                {/if}
              </div>

              <!-- AREA KONTEN -->
              <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {#if loadingActivities}
                  {#if activityView === 'table'}
                    <!-- TABLE SKELETON: Activities -->
                    <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm" role="status" aria-busy="true">
                      <div class="overflow-x-auto no-scrollbar">
                        <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                          <thead class="bg-transparent">
                            <tr>
                              {#each ['Nama Aktivitas','Kategori','Jenis','Mitra','Tanggal','Aksi'] as _}
                                <th class="px-3 py-3.5 text-left">
                                  <div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                                </th>
                              {/each}
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                            {#each Array(Math.min(activityPerPage || 10, 10)) as _}
                              <tr class="animate-pulse">
                                <td class="px-3 py-4">
                                  <div class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                                  <div class="mt-2 h-3 w-40 rounded-md bg-slate-200/50 dark:bg-white/5"></div>
                                </td>
                                <td class="px-3 py-4"><span class="block h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5"></span></td>
                                <td class="px-3 py-4"><div class="h-4 w-24 rounded-md bg-slate-200/70 dark:bg-white/5"></div></td>
                                <td class="px-3 py-4"><div class="h-4 w-36 rounded-md bg-slate-200/70 dark:bg-white/5"></div></td>
                                <td class="px-3 py-4"><div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"></div></td>
                                <td class="px-3 py-4">
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
                      <!-- pagination skeleton -->
                      <div class="border-t border-slate-200/70 dark:border-white/10 px-3 py-3.5">
                        <div class="flex items-center justify-between">
                          <div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                          <div class="flex items-center gap-2">
                            <div class="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                            <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                            <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  {:else}
                    <!-- LIST SKELETON: Activities -->
                    <div class="mt-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm" role="status" aria-busy="true">
                      <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
                        {#each Array(6) as _}
                          <li class="px-4 py-4 sm:px-6 animate-pulse">
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
                      <div class="border-t border-slate-200/70 dark:border-white/10 px-3 py-3.5">
                        <div class="flex items-center justify-between">
                          <div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                          <div class="flex items-center gap-2">
                            <div class="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                            <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                            <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/if}
                {:else if errorActivities}
                  <p class="mt-4 text-rose-500">{errorActivities}</p>
                {:else if activities.length === 0}
                  <div class="mt-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
                    <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada aktivitas.</p>
                  </div>
                {:else}
                  {#if activityView === 'list'}
                    <!-- (list view kamu yang sudah ada) -->
                    <div class="mt-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
                      <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
                        {#each activities as activity (activity.id)}
                          <li>
                            <a href={`/activities/${activity.id}`} class="block hover:bg-violet-600/5 dark:hover:bg-white/5 px-4 py-4 sm:px-6">
                              <div class="flex items-center justify-between">
                                <p class="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">{activity.name}</p>
                                <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-500/15 text-slate-700 dark:text-slate-300">{activity.kategori}</span>
                              </div>
                              <div class="mt-2 sm:flex sm:justify-between">
                                <p class="text-sm text-slate-600 dark:text-slate-300">
                                  Jenis: {activity.jenis}
                                  {#if activity.jenis === 'Vendor' && activity.mitra}
                                    · Vendor: {activity.mitra.nama}
                                  {:else if activity.jenis === 'Customer' && activity.mitra}
                                    · Customer: {activity.mitra.nama}
                                  {/if}
                                  · Deskripsi: {activity.description.substring(0, 40)}{activity.description.length > 40 ? '...' : ''}
                                </p>
                                <p class="mt-2 sm:mt-0 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>
                                  {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </a>
                            <div class="flex justify-end px-4 py-2 sm:px-6 gap-2">
                              <button on:click|stopPropagation={() => openActivityDetailDrawer(activity)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700">Detail</button>
                              <button on:click|stopPropagation={() => openEditActivityModal(activity)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
                              <button on:click|stopPropagation={() => handleDeleteActivity(activity.id)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
                            </div>
                          </li>
                        {/each}
                      </ul>
                      {#if activities.length > 0}
                        <Pagination
                          currentPage={activityCurrentPage}
                          lastPage={activityLastPage}
                          onPageChange={goToActivityPage}
                          totalItems={totalActivities}
                          itemsPerPage={activityPerPage}
                          perPageOptions={perPageOptions}
                          onPerPageChange={(n) => { activityPerPage = n; activityCurrentPage = 1; fetchActivities(); }}
                        />
                      {/if}
                    </div>
                  {/if}

                  {#if activityView === 'table'}
                    <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
                      <div class="overflow-x-auto no-scrollbar">
                        <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                          <thead>
                            <tr>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Tanggal Aktivitas</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Nama Aktivitas</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Kategori</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Jenis</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Mitra</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Aksi</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                            {#each activities as activity (activity.id)}
                              <tr>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                  {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm font-medium">
                                  <a href={`/activities/${activity.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{activity.name}</a><br>
                                  <span class="text-xs text-slate-500 dark:text-slate-400">{activity.short_desc}</span>
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm">
                                  <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-500/15 text-slate-700 dark:text-slate-300">{activity.kategori}</span>
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{activity.jenis}</td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                  {#if activity.jenis === 'Vendor' && activity.mitra}{activity.mitra.nama}
                                  {:else if activity.jenis === 'Customer' && activity.mitra}{activity.mitra.nama}
                                  {:else}-{/if}
                                </td>
                                <td class="relative whitespace-nowrap px-3 py-4 text-sm">
                                  <div class="flex items-center gap-2">
                                    <button on:click={() => openActivityDetailDrawer(activity)} class="text-amber-600 hover:text-amber-700" title="Detail">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                      <span class="sr-only">Detail, {activity.name}</span>
                                    </button>
                                    <button on:click|stopPropagation={() => openEditActivityModal(activity)} title="Edit" class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
                                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                      <span class="sr-only">Edit, {activity.name}</span>
                                    </button>
                                    <button on:click|stopPropagation={() => handleDeleteActivity(activity.id)} title="Delete" class="text-rose-600 hover:text-rose-700">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                      <span class="sr-only">Hapus, {activity.name}</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                      {#if activities.length > 0}
                        <Pagination
                          currentPage={activityCurrentPage}
                          lastPage={activityLastPage}
                          onPageChange={goToActivityPage}
                          totalItems={totalActivities}
                          itemsPerPage={activityPerPage}
                          perPageOptions={perPageOptions}
                          onPerPageChange={(n) => { activityPerPage = n; activityCurrentPage = 1; fetchActivities(); }}
                        />
                      {/if}
                    </div>
                  {/if}
                {/if}
              </div>
            </section>
          </div>

          <!-- ===== MOBILE FILTER (Activity) ===== -->
          {#if showMobileFilter}
            <ActivityFilterMobile
              bind:open={showMobileFilter}
              jenisOptions={activityJenisList}
              kategoriOptions={activityKategoriList}
              vendorOptions={projectVendorOptions}
              jenisValue={activityJenisFilter}
              kategoriValue={activityKategoriFilter}
              vendorValue={activityVendorFilter}
              dateFrom={activityDateFromFilter}
              dateTo={activityDateToFilter}
              on:update={(e)=>{ const {key,value}=e.detail; 
                if(key==='jenis') activityJenisFilter=value;
                if(key==='kategori') activityKategoriFilter=value;
                if(key==='vendor') activityVendorFilter=value;
                if(key==='dateFrom') activityDateFromFilter=value;
                if(key==='dateTo') activityDateToFilter=value;
              }}
              on:clear={() => { clearAllActivityFilters(); }}
              on:apply={() => { showMobileFilter = false; handleActivityFilterOrSearch(); }}
              on:close={() => (showMobileFilter = false)}
            />
          {/if}
        {/if}

        <!-- Action Bar: Certificates -->
        {#if activeTab === 'certificates'}
          <div class={"grid grid-cols-1 gap-4 " + (showSidebar ? "lg:grid-cols-[260px_minmax(0,1fr)]" : "")}>
            <!-- SIDEBAR (desktop) -->
            <!-- svelte-ignore a11y_no_redundant_roles -->
            <aside role="complementary" aria-label="Filter" class={"hidden " + (showSidebar ? "lg:block" : "lg:hidden")}>
              <div class="sticky top-[72px]">
                <div class="max-h-[calc(100dvh-72px-48px)] overflow-y-auto overscroll-contain no-scrollbar [@supports(-webkit-overflow-scrolling:touch)]:[-webkit-overflow-scrolling:touch]">
                  <CertificateFilterDesktop
                    statusOptions={Array.from(certificateStatuses)}
                    statusValue={certificateStatusFilter}
                    dateFrom={certificateDateFromFilter}
                    dateTo={certificateDateToFilter}
                    on:update={(e)=>{ const {key,value}=e.detail;
                      if(key==='status') certificateStatusFilter=value;
                      if(key==='dateFrom') certificateDateFromFilter=value;
                      if(key==='dateTo') certificateDateToFilter=value;
                      handleCertificateFilterOrSearch();
                    }}
                    on:clear={() => { clearAllCertificateFilters(); }}
                  />
                </div>
              </div>
            </aside>

            <!-- KONTEN KANAN -->
            <section class="min-w-0 flex flex-col min-h-[calc(100dvh-60px-48px)] sm:min-h-[calc(100dvh-72px-48px)]">
              <!-- STICKY ACTION BAR + CHIPS -->
              <div class="border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10 sticky z-30 top-[60px] sm:top-[72px]">
                <!-- ACTION BAR -->
                <div class="flex items-center gap-2 flex-nowrap bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-2 py-2">
                  <!-- kiri: tombol filter + switch view -->
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      on:click={toggleFilter}
                      class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm
                            border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70
                            text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      aria-label="Filter"
                    >
                      {#if showSidebar}
                        <svg class="w-5 h-5 hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
                        </svg>

                        <svg class="w-5 h-5 lg:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M4 6h16M6 12h12M10 18h4"/>
                        </svg>

                      {:else}
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M4 6h16M6 12h12M10 18h4"/>
                        </svg>
                      {/if}
                      <span class="sr-only">Filter</span>
                    </button>

                    <div class="bg-slate-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-md inline-flex"
                        role="tablist" aria-label="Switch view" tabindex="0" on:keydown={handleCertificateViewKeydown}>
                      <button on:click={() => (certificateView='table')}
                        class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                        class:bg-white={certificateView==='table'} class:dark:bg-[#12101d]={certificateView==='table'} class:shadow={certificateView==='table'} title="Table">
                        <!-- icon table -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><line x1="3.5" y1="9"  x2="20.5" y2="9"></line><line x1="3.5" y1="13" x2="20.5" y2="13"></line><line x1="3.5" y1="17" x2="20.5" y2="17"></line></svg>
                      </button>
                      <button on:click={() => (certificateView='list')}
                        class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                        class:bg-white={certificateView==='list'} class:dark:bg-[#12101d]={certificateView==='list'} class:shadow={certificateView==='list'} title="List">
                        <!-- icon list -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="5" cy="6" r="1.3"></circle><circle cx="5" cy="12" r="1.3"></circle><circle cx="5" cy="18" r="1.3"></circle><line x1="9" y1="6"  x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line></svg>
                      </button>
                    </div>
                  </div>

                  <!-- kanan: search + tambah sertif -->
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div class="relative flex-1 min-w-0">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" /></svg>
                      </div>
                      <input type="text" placeholder="Cari sertifikat..." bind:value={certificateSearch} on:input={handleCertificateSearchChange}
                        class="block w-full pl-10 pr-3 h-9 rounded-md text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 placeholder-slate-500 dark:placeholder-slate-400" />
                    </div>
                    <button on:click={openCreateCertificateModal}
                      class="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 grid place-items-center shrink-0"
                      aria-label="Tambah Project" title="Tambah Project">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- CHIPS -->
                {#if certificateFilterChips.length}
                  <div class="flex items-center flex-wrap gap-2 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur px-3 py-2">
                    {#each certificateFilterChips as chip}
                      <span class="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 px-3 py-1 text-xs font-medium">
                        {chip.label}
                        <button type="button" aria-label="Hapus filter" class="opacity-70 hover:opacity-100" on:click={() => clearOneCertificateFilter(chip.key)}>✕</button>
                      </span>
                    {/each}
                    <button type="button" class="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline" on:click={clearAllCertificateFilters}>Clear</button>
                  </div>
                {/if}
              </div>

              <!-- AREA KONTEN -->
              <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {#if loadingCertificates}
                  {#if certificateView === 'table'}
                    <!-- TABLE SKELETON: Certificates -->
                    <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm" role="status" aria-busy="true">
                      <div class="overflow-x-auto no-scrollbar">
                        <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                          <thead class="bg-transparent">
                            <tr>
                              {#each ['Nama','No. Sertifikat','Barang','Status','Terbit','Expired','Aksi'] as _}
                                <th class="px-3 py-3.5 text-left">
                                  <div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                                </th>
                              {/each}
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                            {#each Array(Math.min(certificatePerPage || 10, 10)) as _}
                              <tr class="animate-pulse">
                                <td class="px-3 py-4">
                                  <div class="h-4 w-56 rounded-md bg-slate-200/70 dark:bg-white/5"></div>
                                  <div class="mt-2 h-3 w-40 rounded-md bg-slate-200/50 dark:bg-white/5"></div>
                                </td>
                                <td class="px-3 py-4"><div class="h-4 w-40 rounded-md bg-slate-200/70 dark:bg-white/5"></div></td>
                                <td class="px-3 py-4"><div class="h-4 w-44 rounded-md bg-slate-200/70 dark:bg-white/5"></div></td>
                                <td class="px-3 py-4"><span class="block h-5 w-20 rounded-full bg-slate-200/70 dark:bg-white/5"></span></td>
                                <td class="px-3 py-4"><div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"></div></td>
                                <td class="px-3 py-4"><div class="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-white/5"></div></td>
                                <td class="px-3 py-4">
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
                      <!-- pagination skeleton -->
                      <div class="border-t border-slate-200/70 dark:border-white/10 px-3 py-3.5">
                        <div class="flex items-center justify-between">
                          <div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                          <div class="flex items-center gap-2">
                            <div class="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                            <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                            <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  {:else}
                    <!-- LIST SKELETON: Certificates -->
                    <div class="mt-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm" role="status" aria-busy="true">
                      <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
                        {#each Array(6) as _}
                          <li class="px-4 py-4 sm:px-6 animate-pulse">
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
                      <div class="border-t border-slate-200/70 dark:border-white/10 px-3 py-3.5">
                        <div class="flex items-center justify-between">
                          <div class="h-4 w-48 rounded-md bg-slate-200/70 dark:bg-white/10 animate-pulse"></div>
                          <div class="flex items-center gap-2">
                            <div class="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                            <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                            <div class="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-white/5 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/if}
                {:else if errorCertificates}
                  <p class="mt-4 text-rose-500">{errorCertificates}</p>
                {:else if certificates.length === 0}
                  <div class="mt-4 border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
                    <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada sertifikat untuk proyek ini.</p>
                  </div>
                {:else}
                  {#if certificateView === 'list'}
                    <!-- (list view kamu yang sudah ada) -->
                    <div class="mt-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
                      <ul class="divide-y divide-slate-200/70 dark:divide-white/10">
                        {#each certificates as item (item.id)}
                          <li>
                            <a href={`/certificates/${item.id}`} class="block hover:bg-violet-600/5 dark:hover:bg-white/5 px-4 py-4 sm:px-6">
                              <div class="flex items-center justify-between">
                                <p class="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">{item.name}</p>
                                <span class={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getCertificateStatusBadgeClasses(item.status)}`}>{item.status}</span>
                              </div>
                              <div class="mt-2 sm:flex sm:justify-between">
                                <p class="text-sm text-slate-600 dark:text-slate-300">Barang: {item.barang_certificate?.name || '-'} · No: {item.no_certificate}</p>
                                <p class="mt-2 sm:mt-0 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>
                                  {#if item.date_of_issue}Terbit: {new Date(item.date_of_issue).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}{:else}Terbit: -{/if}
                                </p>
                              </div>
                            </a>
                            <div class="flex justify-end px-4 py-2 sm:px-6 gap-2">
                              <button on:click|stopPropagation={() => openCertificateDetailDrawer(item)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700">Detail</button>
                              <button on:click|stopPropagation={() => openEditCertificateModal(item)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700">Edit</button>
                              <button on:click|stopPropagation={() => handleDeleteCertificate(item.id)} class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700">Hapus</button>
                            </div>
                          </li>
                        {/each}
                      </ul>
                      {#if certificates.length > 0}
                        <Pagination
                          currentPage={certificateCurrentPage}
                          lastPage={certificateLastPage}
                          onPageChange={goToCertificatePage}
                          totalItems={totalCertificates}
                          itemsPerPage={certificatePerPage}
                          perPageOptions={perPageOptions}
                          onPerPageChange={(n) => { certificatePerPage = n; certificateCurrentPage = 1; fetchCertificates(); }}
                        />
                      {/if}
                    </div>
                  {/if}

                  {#if certificateView === 'table'}
                    <div class="px-4 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
                      <div class="overflow-x-auto no-scrollbar">
                        <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                          <thead>
                            <tr>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Nama Sertifikat</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">No. Sertifikat</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Barang Sertifikat</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Status</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Terbit</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Expired</th>
                              <th class="px-3 py-3.5 text-left text-sm font-semibold">Aksi</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                            {#each certificates as item (item.id)}
                              <tr>
                                <td class="whitespace-nowrap px-3 py-4 text-sm font-medium">
                                  <a href={`/certificates/${item.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{item.name}</a>
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{item.no_certificate}</td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{item.barang_certificate?.name || '-'}</td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm">
                                  <span class={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getCertificateStatusBadgeClasses(item.status)}`}>{item.status}</span>
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                  {#if item.date_of_issue}{new Date(item.date_of_issue).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}{:else}-{/if}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                  {#if item.date_of_expired}{new Date(item.date_of_expired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}{:else}-{/if}
                                </td>
                                <td class="relative whitespace-nowrap px-3 py-4 text-sm">
                                  <div class="flex items-center gap-2">
                                    <button title="Detail" class="text-amber-600 hover:text-amber-700" on:click={() => openCertificateDetailDrawer(item)}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                      <span class="sr-only">Detail, {item.name}</span>
                                    </button>
                                    <button title="Edit" class="text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200" on:click={() => openEditCertificateModal(item)}>
                                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                      <span class="sr-only">Edit, {item.name}</span>
                                    </button>
                                    <button title="Hapus" class="text-rose-600 hover:text-rose-700" on:click={() => handleDeleteCertificate(item.id)}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                      <span class="sr-only">Hapus, {item.name}</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                      {#if certificates.length > 0}
                        <Pagination
                          currentPage={certificateCurrentPage}
                          lastPage={certificateLastPage}
                          onPageChange={goToCertificatePage}
                          totalItems={totalCertificates}
                          itemsPerPage={certificatePerPage}
                          perPageOptions={perPageOptions}
                          onPerPageChange={(n) => { certificatePerPage = n; certificateCurrentPage = 1; fetchCertificates(); }}
                        />
                      {/if}
                    </div>
                  {/if}
                {/if}
              </div>
            </section>
          </div>

          <!-- ===== MOBILE FILTER (Certificates) ===== -->
          {#if showMobileFilter}
            <CertificateFilterMobile
              bind:open={showMobileFilter}
              statusOptions={Array.from(certificateStatuses)}
              statusValue={certificateStatusFilter}
              dateFrom={certificateDateFromFilter}
              dateTo={certificateDateToFilter}
              on:update={(e)=>{ const {key,value}=e.detail;
                if(key==='status') certificateStatusFilter=value;
                if(key==='dateFrom') certificateDateFromFilter=value;
                if(key==='dateTo') certificateDateToFilter=value;
              }}
              on:clear={() => { clearAllCertificateFilters(); }}
              on:apply={() => { showMobileFilter = false; handleCertificateFilterOrSearch(); }}
              on:close={() => (showMobileFilter = false)}
            />
          {/if}
        {/if}
      </div>
    </section>

    <!-- Modals & Drawers -->
    {#if showEditProjectModal}
      <ProjectFormModal bind:show={showEditProjectModal} title="Edit Project" submitLabel="Update Project" idPrefix="edit_project"
        form={editProjectForm} {customers} {projectStatuses} {projectKategoris} onSubmit={handleSubmitUpdateProject} />
    {/if}

    <ActivityFormModal
      bind:show={showCreateActivityModal}
      title="Form Tambah Aktivitas"
      submitLabel="Tambah Aktivitas"
      idPrefix="create_activity"
      form={createActivityForm}
      projects={project ? [project] : []}
      showProjectSelect={false}
      {vendors}
      allowRemoveAttachment={false}
      onSubmit={handleSubmitCreateActivity}
    />

    {#if editingActivity}
      <ActivityFormModal
        bind:show={showEditActivityModal}
        title="Edit Aktivitas"
        submitLabel="Update Aktivitas"
        idPrefix="edit_activity"
        form={editActivityForm}
        projects={project ? [project] : []}
        showProjectSelect={false}
        {vendors}
        allowRemoveAttachment={true}
        onSubmit={handleSubmitUpdateActivity}
      />
    {/if}

    <Drawer bind:show={showActivityDetailDrawer} title="Detail Activity" on:close={() => (showActivityDetailDrawer = false)}>
      <ActivityDetail activity={selectedActivity} />
    </Drawer>

    <CertificateFormModal
      bind:show={showCreateCertificateModal}
      title="Tambah Sertifikat"
      submitLabel="Simpan"
      idPrefix="create_cert"
      form={certificateForm}
      projects={[]}
      barangOptions={certificateBarangOptions}
      statuses={Array.from(certificateStatuses)}
      allowRemoveAttachment={true}
      showProjectSelect={false}
      onSubmit={handleSubmitCreateCertificate}
    />

    {#if editingCertificate}
      <CertificateFormModal
        bind:show={showEditCertificateModal}
        title="Edit Sertifikat"
        submitLabel="Update"
        idPrefix="edit_cert"
        form={certificateForm}
        projects={[]}
        barangOptions={certificateBarangOptions}
        statuses={Array.from(certificateStatuses)}
        allowRemoveAttachment={true}
        showProjectSelect={false}
        onSubmit={handleSubmitUpdateCertificate}
      />
    {/if}

    <Drawer bind:show={showCertificateDetailDrawer} title="Detail Sertifikat" on:close={() => (showCertificateDetailDrawer = false)}>
      <CertificatesDetail certificates={selectedCertificate} />
    </Drawer>
  </div>
{/if}
