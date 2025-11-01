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

  // ===== Fetch Activities (list dalam project) =====
  // Filter/search state
  let activityJenisFilter = '';
  let activityKategoriFilter = '';
  let activitySearch = '';
  let activityDateFromFilter = '';
  let activityDateToFilter = '';
  let showActivityDateFilter = false;

  // Paging
  let activityCurrentPage = 1;
  let activityLastPage = 1;
  let totalActivities = 0;
  let activityPerPage = 10;
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
    name: '', description: '', project_id: '',
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
  let editActivityForm = {
    name: '', description: '', project_id: '',
    kategori: '', activity_date: '',
    attachment: null as File | null,
    jenis: '', mitra_id: null as string | null,
    from: '', to: '',
    attachment_removed: false,
  };
  let editActivityFileName = '';

  function openCreateActivityModal() {
    createActivityForm = {
      name: '', description: '', project_id: project.id,
      kategori: '', activity_date: '', attachment: null,
      jenis: project.mitra && project.mitra.is_customer ? 'Customer' : '',
      mitra_id: project.mitra && project.mitra.is_customer ? project.mitra.id : null,
      from: '', to: '',
    };
    createActivityFileName = '';
    showCreateActivityModal = true;
  }
  function openEditActivityModal(activity: any) {
    editingActivity = { ...activity, activity_date: activity.activity_date ? new Date(activity.activity_date).toISOString().split('T')[0] : '' };
    editActivityForm = {
      ...editingActivity,
      project_id: editingActivity.project_id || '',
      kategori: editingActivity.kategori || '',
      jenis: editingActivity.jenis || '',
      mitra_id: editingActivity.mitra_id || '',
      attachment: null,
      from: editingActivity.from || '',
      to: editingActivity.to || '',
      attachment_removed: false,
    };
    editActivityFileName = activity.attachment ? activity.attachment.split('/').pop() : '';
    showEditActivityModal = true;
  }

  function openActivityDetailDrawer(activity: any) { selectedActivity = { ...activity }; showActivityDetailDrawer = true; }

  function buildFD(obj: Record<string, any>) {
    const fd = new FormData();
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (k === 'attachment' && v === null) return;
      if (k === 'attachment_removed') return; // biar kita set manual di edit
      fd.append(k, v as any);
    });
    return fd;
  }

  async function handleSubmitCreateActivity() {
    try {
      const fd = buildFD(createActivityForm);
      if (createActivityForm.jenis === 'Internal')       fd.set('mitra_id', '1');
      else if (createActivityForm.jenis === 'Customer')  fd.set('mitra_id', String(project.mitra_id));
      await apiFetch('/activities', { method: 'POST', body: fd, auth: true });
      alert('Aktivitas berhasil ditambahkan!');
      goto(`/projects/${project.id}`);
      showCreateActivityModal = false;
      fetchActivities();
    } catch (err: any) {
      alert('Error:\n' + (err?.message || 'Gagal menambahkan aktivitas.'));
    }
  }

  async function handleSubmitUpdateActivity() {
    if (!editingActivity?.id) return;
    try {
      const fd = buildFD(editActivityForm);
      if (editActivityForm.jenis === 'Internal')       fd.set('mitra_id', '1');
      else if (editActivityForm.jenis === 'Customer')  fd.set('mitra_id', String(project.mitra_id));
      fd.append('attachment_removed', editActivityForm.attachment_removed ? '1' : '0');
      fd.append('_method', 'PUT');

      await apiFetch(`/activities/${editingActivity.id}`, { method: 'POST', body: fd, auth: true });
      alert('Aktivitas berhasil diperbarui!');
      goto(`/projects/${project.id}`);
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

  // Vendor filter
  $: if (activityJenisFilter !== 'Vendor') {
    activityVendorFilter = '';
  }

  // List referensi
  const activityKategoriList = ['Expense Report','Invoice','Purchase Order','Payment','Quotation','Faktur Pajak','Kasbon','Laporan Teknis','Surat Masuk','Surat Keluar','Kontrak'];
  const activityJenisList = ['Internal','Customer','Vendor'];

  // Switch List/Table
  let activeTab: 'detail' | 'activity' | 'certificates' = 'detail';
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
  let certificatePerPage = 10;

  function openCreateCertificateModal() {
    certificateForm = {
      name: '', no_certificate: '', project_id: project?.id ?? '',
      barang_certificate_id: '', status: '',
      date_of_issue: '', date_of_expired: '', attachment: null, attachment_removed: false,
    };
    certificateFormFileName = '';
    showCreateCertificateModal = true;
  }
  function openEditCertificateModal(item: ProjectCertificate) {
    editingCertificate = { ...item };
    certificateForm = {
      name: item.name ?? '', no_certificate: item.no_certificate ?? '', project_id: project?.id ?? '',
      barang_certificate_id: item.barang_certificate?.id ?? '',
      status: item.status ?? '',
      date_of_issue: item.date_of_issue ? new Date(item.date_of_issue).toISOString().split('T')[0] : '',
      date_of_expired: item.date_of_expired ? new Date(item.date_of_expired).toISOString().split('T')[0] : '',
      attachment: null, attachment_removed: false,
    };
    certificateFormFileName = item.attachment ? String(item.attachment).split('/').pop() ?? '' : '';
    showEditCertificateModal = true;
  }
  function openCertificateDetailDrawer(item: ProjectCertificate) { selectedCertificate = { ...item }; showCertificateDetailDrawer = true; }

  function buildCertificateFormData() {
    const fd = new FormData();
    const f = certificateForm;
    fd.append('name', f.name);
    fd.append('no_certificate', f.no_certificate);
    if (project?.id) fd.append('project_id', String(project.id));
    if (f.barang_certificate_id) fd.append('barang_certificate_id', String(f.barang_certificate_id));
    if (f.status) fd.append('status', f.status);
    fd.append('date_of_issue', f.date_of_issue || '');
    fd.append('date_of_expired', f.date_of_expired || '');
    if (f.attachment) fd.append('attachment', f.attachment);
    if (f.attachment_removed) fd.append('attachment_removed', '1');
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
</script>

<svelte:head>
  <title>Detail Project - Indogreen</title>
</svelte:head>

{#if loadingProject}
  <p class="text-slate-900 dark:text-slate-100">Memuat proyek...</p>
{:else if errorProject}
  <p class="text-rose-500">{errorProject}</p>
{:else if project}
  <div class="max-w-1xl mx-auto mb-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100 sm:text-2xl">
          {project.name}
        </h2>
        <div class="my-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <div class="my-2 flex items-center text-sm text-slate-500 dark:text-slate-300">
            <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          <div class="my-2 flex items-center text-sm">
            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold {getStatusBadgeClasses(project.status)}">
              {project.status}
            </span>
          </div>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 mb-4 md:mt-0 md:ml-4 md:mb-4 gap-2 md:gap-4">
        <button
          on:click={openEditProjectModal}
          class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm">
          Edit Project
        </button>
        <button
          on:click={handleDeleteProject}
          class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm">
          Hapus Project
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center justify-between mb-4">
      <div class="p-1 bg-slate-100/70 dark:bg-white/5 rounded-lg inline-flex" role="tablist">
        <button on:click={() => (activeTab = 'detail')}
          class="px-4 py-2 rounded-lg font-semibold text-sm text-slate-700 dark:text-slate-200"
          class:bg-white={activeTab === 'detail'} class:dark:bg-[#12101d]={activeTab === 'detail'} class:shadow={activeTab === 'detail'}>Detail</button>
        <button on:click={() => (activeTab = 'activity')}
          class="px-4 py-2 rounded-lg font-semibold text-sm text-slate-700 dark:text-slate-200"
          class:bg-white={activeTab === 'activity'} class:dark:bg-[#12101d]={activeTab === 'activity'} class:shadow={activeTab === 'activity'}>Activity</button>
        {#if project?.is_cert_projects}
          <button on:click={() => (activeTab = 'certificates')}
            class="px-4 py-2 rounded-lg font-semibold text-sm text-slate-700 dark:text-slate-200"
            class:bg-white={activeTab === 'certificates'} class:dark:bg-[#12101d]={activeTab === 'certificates'} class:shadow={activeTab === 'certificates'}>Certificate</button>
        {/if}
      </div>
    </div>

    <!-- DETAIL -->
    {#if activeTab === 'detail'}
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm overflow-hidden mb-8">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">Informasi Project</h3>
        </div>
        <div class="border-t border-slate-200/60 dark:border-white/10">
          <ProjectDetail project={project} />
        </div>
      </div>
    {/if}

    <!-- ACTIVITY -->
    {#if activeTab === 'activity'}
      <div class="mb-8">
        <!-- Filter bar -->
        <div class="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
          <div class="flex w-full sm:w-auto gap-2">
            <select bind:value={activityJenisFilter} on:change={handleActivityFilterOrSearch}
              class="px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
              <option value="">Filter Jenis: Semua</option>
              {#each activityJenisList as jenis}<option value={jenis}>{jenis}</option>{/each}
            </select>
            {#if activityJenisFilter === 'Vendor'}
              <select
                bind:value={activityVendorFilter}
                on:change={handleActivityFilterOrSearch}
                class="px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70"
              >
                <option value="">Filter Vendor: Semua</option>
                {#each projectVendorOptions as v}
                  <option value={v.id}>{v.nama}</option>
                {/each}
              </select>
            {/if}
            <select bind:value={activityKategoriFilter} on:change={handleActivityFilterOrSearch}
              class="px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
              <option value="">Filter Kategori: Semua</option>
              {#each activityKategoriList as kategori}<option value={kategori}>{kategori}</option>{/each}
            </select>
          </div>

          <div class="w-full sm:w-auto flex-grow">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" /></svg>
              </div>
              <input type="text" placeholder="Cari aktivitas..." bind:value={activitySearch} on:input={handleActivityFilterOrSearch}
                class="block w-full pl-10 pr-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 placeholder-slate-500 dark:placeholder-slate-400" />
            </div>
          </div>

          <button on:click={openCreateActivityModal}
            class="px-4 py-2 w-full sm:w-auto rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm">
            Tambah Aktivitas
          </button>
        </div>

        <!-- Switch + Date -->
        <div class="flex items-center justify-between mb-4">
          <div class="bg-slate-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl inline-flex gap-1 p-1"
               role="tablist" tabindex="0" on:keydown={handleActivityViewKeydown}>
            <button on:click={() => (activityView = 'table')}
              class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
              class:bg-white={activityView === 'table'} class:dark:bg-[#12101d]={activityView === 'table'} class:shadow={activityView === 'table'} title="Table">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><line x1="3.5" y1="9"  x2="20.5" y2="9"></line><line x1="3.5" y1="13" x2="20.5" y2="13"></line><line x1="3.5" y1="17" x2="20.5" y2="17"></line></svg>
              <span class="sr-only">Tampilan Tabel</span>
            </button>
            <button on:click={() => (activityView = 'list')}
              class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
              class:bg-white={activityView === 'list'} class:dark:bg-[#12101d]={activityView === 'list'} class:shadow={activityView === 'list'} title="List">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="5" cy="6" r="1.3"></circle><circle cx="5" cy="12" r="1.3"></circle><circle cx="5" cy="18" r="1.3"></circle><line x1="9" y1="6"  x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line></svg>
              <span class="sr-only">Tampilan List</span>
            </button>
          </div>

          <!-- Date filter -->
          <div class="relative date-filter-dropdown">
            <button on:click={toggleActivityDateFilter}
              class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Filter Tanggal
              {#if activityDateFromFilter || activityDateToFilter}<div class="w-2 h-2 bg-violet-600 rounded-full"></div>{/if}
              <svg class="w-4 h-4 transition-transform" class:rotate-180={showActivityDateFilter} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>

            {#if showActivityDateFilter}
              <div class="absolute right-0 mt-2 w-80 rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur shadow-xl z-10">
                <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100">Filter Tanggal Aktivitas</h3>
                    <button on:click={toggleActivityDateFilter} class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Tutup">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <div class="space-y-3">
                    <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Dari Tanggal
                      <input type="date" bind:value={activityDateFromFilter} on:change={handleActivityDateFilter}
                        class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
                    </div>
                    <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Sampai Tanggal
                      <input type="date" bind:value={activityDateToFilter} on:change={handleActivityDateFilter}
                        class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
                    </div>

                    {#if activityDateFromFilter || activityDateToFilter}
                      <div class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
                        <strong>Filter Aktif:</strong><br />
                        {#if activityDateFromFilter && activityDateToFilter}
                          {new Date(activityDateFromFilter).toLocaleDateString('id-ID')} - {new Date(activityDateToFilter).toLocaleDateString('id-ID')}
                        {:else if activityDateFromFilter}
                          Dari {new Date(activityDateFromFilter).toLocaleDateString('id-ID')}
                        {:else if activityDateToFilter}
                          Sampai {new Date(activityDateToFilter).toLocaleDateString('id-ID')}
                        {/if}
                      </div>
                    {/if}
                  </div>

                  <div class="flex justify-between mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10">
                    <button type="button" on:click={clearActivityFilters}
                      class="px-3 py-1.5 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                      Clear All
                    </button>
                    <button type="button" on:click={toggleActivityDateFilter}
                      class="px-3 py-1.5 text-sm font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>

        {#if loadingActivities}
          <p class="text-slate-900 dark:text-slate-100">Memuat aktivitas...</p>
        {:else if errorActivities}
          <p class="text-rose-500">{errorActivities}</p>
        {:else if activities.length === 0}
          <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
            <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada aktivitas untuk project ini.</p>
          </div>
        {:else}
          <!-- LIST -->
          {#if activityView === 'list'}
            <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
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

          <!-- TABLE -->
          {#if activityView === 'table'}
            <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                  <thead class="bg-slate-50/60 dark:bg-white/5">
                    <tr>
                      <th class="px-3 py-3.5 text-left text-sm font-semibold">Nama Aktivitas</th>
                      <th class="px-3 py-3.5 text-left text-sm font-semibold">Kategori</th>
                      <th class="px-3 py-3.5 text-left text-sm font-semibold">Jenis</th>
                      <th class="px-3 py-3.5 text-left text-sm font-semibold">Mitra</th>
                      <th class="px-3 py-3.5 text-left text-sm font-semibold">Tanggal Aktivitas</th>
                      <th class="px-3 py-3.5 text-left text-sm font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200/70 dark:divide-white/10">
                    {#each activities as activity (activity.id)}
                      <tr>
                        <td class="whitespace-nowrap px-3 py-4 text-sm font-medium">
                          <a href={`/activities/${activity.id}`} class="text-violet-700 dark:text-violet-300 hover:underline">{activity.name}</a><br>
                          <span class="text-xs text-slate-500 dark:text-slate-400">{activity.description.substring(0, 40)}{activity.description.length > 40 ? '...' : ''}</span>
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
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
    {/if}

    <!-- CERTIFICATES -->
    {#if activeTab === 'certificates'}
      <div class="mb-8">
        <!-- Filter bar -->
        <div class="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
          <div class="flex w-full sm:w-auto gap-2">
            <select bind:value={certificateStatusFilter} on:change={handleCertificateFilterOrSearch}
              class="px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
              <option value="">Filter Status: Semua</option>
              {#each certificateStatuses as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>

          <div class="w-full sm:w-auto flex-grow">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" /></svg>
              </div>
              <input type="text" placeholder="Cari sertifikat..." bind:value={certificateSearch} on:input={handleCertificateSearchChange}
                class="block w-full pl-10 pr-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 placeholder-slate-500 dark:placeholder-slate-400" />
            </div>
          </div>

          <div class="flex gap-2 w-full sm:w-auto">
            <button on:click={openCreateCertificateModal}
              class="px-4 py-2 w-full sm:w-auto rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm">
              Tambah Sertif
            </button>
          </div>
        </div>

        <!-- Switch + Date -->
        <div class="flex items-center justify-between mb-4">
          <div class="bg-slate-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl inline-flex gap-1 p-1"
               role="tablist" tabindex="0" on:keydown={handleCertificateViewKeydown}>
            <button on:click={() => (certificateView = 'table')}
              class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
              class:bg-white={certificateView === 'table'} class:dark:bg-[#12101d]={certificateView === 'table'} class:shadow={certificateView === 'table'} title="Table">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><line x1="3.5" y1="9"  x2="20.5" y2="9"></line><line x1="3.5" y1="13" x2="20.5" y2="13"></line><line x1="3.5" y1="17" x2="20.5" y2="17"></line></svg>
              <span class="sr-only">Tampilan Tabel</span>
            </button>
            <button on:click={() => (certificateView = 'list')}
              class="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
              class:bg-white={certificateView === 'list'} class:dark:bg-[#12101d]={certificateView === 'list'} class:shadow={certificateView === 'list'} title="List">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="5" cy="6" r="1.3"></circle><circle cx="5" cy="12" r="1.3"></circle><circle cx="5" cy="18" r="1.3"></circle><line x1="9" y1="6"  x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line></svg>
              <span class="sr-only">Tampilan List</span>
            </button>
          </div>

          <!-- Date filter -->
          <div class="relative certificate-date-filter-dropdown">
            <button on:click={toggleCertificateDateFilter}
              class="certificate-date-filter-button inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Filter Tanggal
              {#if certificateDateFromFilter || certificateDateToFilter}<div class="w-2 h-2 bg-violet-600 rounded-full"></div>{/if}
              <svg class="w-4 h-4 transition-transform" class:rotate-180={showCertificateDateFilter} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>

            {#if showCertificateDateFilter}
              <div class="absolute right-0 mt-2 w-80 rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur shadow-xl z-10">
                <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100">Filter Tanggal Sertifikat</h3>
                    <button on:click={toggleCertificateDateFilter} aria-label="Tutup filter" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <div class="space-y-3">
                    <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Dari Tanggal Terbit
                      <input type="date" bind:value={certificateDateFromFilter} on:change={handleCertificateDateFilter}
                        class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
                    </div>
                    <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Sampai Tanggal Terbit
                      <input type="date" bind:value={certificateDateToFilter} on:change={handleCertificateDateFilter}
                        class="w-full px-3 py-2 rounded-xl text-sm border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70" />
                    </div>

                    {#if certificateDateFromFilter || certificateDateToFilter}
                      <div class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
                        <strong>Filter Aktif:</strong><br />
                        {#if certificateDateFromFilter && certificateDateToFilter}
                          {new Date(certificateDateFromFilter).toLocaleDateString('id-ID')} - {new Date(certificateDateToFilter).toLocaleDateString('id-ID')}
                        {:else if certificateDateFromFilter}
                          Dari {new Date(certificateDateFromFilter).toLocaleDateString('id-ID')}
                        {:else if certificateDateToFilter}
                          Sampai {new Date(certificateDateToFilter).toLocaleDateString('id-ID')}
                        {/if}
                      </div>
                    {/if}
                  </div>

                  <div class="flex justify-between mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10">
                    <button type="button" on:click={() => { certificateDateFromFilter = ''; certificateDateToFilter = ''; handleCertificateFilterOrSearch(); }}
                      class="px-3 py-1.5 text-sm font-medium rounded-xl border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5">Clear All</button>
                    <button type="button" on:click={toggleCertificateDateFilter}
                      class="px-3 py-1.5 text-sm font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700">Close</button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>

        {#if loadingCertificates}
          <p class="text-slate-900 dark:text-slate-100">Memuat sertifikat...</p>
        {:else if errorCertificates}
          <p class="text-rose-500">{errorCertificates}</p>
        {:else if certificates.length === 0}
          <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur p-5">
            <p class="text-sm text-slate-600 dark:text-slate-300">Belum ada sertifikat untuk proyek ini.</p>
          </div>
        {:else}
          <!-- LIST -->
          {#if certificateView === 'list'}
            <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
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

          <!-- TABLE -->
          {#if certificateView === 'table'}
            <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12101d]/70 backdrop-blur shadow-sm">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                  <thead class="bg-slate-50/60 dark:bg-white/5">
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
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
    {/if}
  </div>

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
{/if}
