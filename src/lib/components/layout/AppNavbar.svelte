<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import ThemeToggle from './ThemeToggle.svelte';
  import { apiFetch, getToken, setToken } from '$lib/api';
  import { fly, fade } from 'svelte/transition';
  import { currentUser, setUser } from '$lib/stores/user';
  import { userPermissions } from '$lib/stores/permissions';
  import { get } from 'svelte/store';
  import ConfirmDialog from '../ConfirmDialog.svelte';

  type Link = { name: string; href: string; perm?: string };

  const links: Link[] = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Project', href: '/projects', perm: 'project-view' },
    { name: 'Activity', href: '/activities', perm: 'activity-view' },
    { name: 'Mitra', href: '/mitras', perm: 'mitra-view' },
    { name: 'Barang Sertifikat', href: '/barang-certificates', perm: 'bc-view' },
    { name: 'Sertifikat', href: '/certificates', perm: 'certificate-view' }
  ];

  let navEl: HTMLElement;
  let leftEl: HTMLDivElement;
  let rightEl: HTMLDivElement;
  let logoEl: HTMLAnchorElement;

  let visible: Link[] = [];
  let overflow: Link[] = [];
  let showMore = false;
  let showProfile = false;
  let showMobile = false;

  let showLogoutConfirm = false;
  let pendingLogout = false;

  function isActive(href: string, current: string) {
    return current === href || current.startsWith(href + '/');
  }

  // Reactive allowed links based on store
  // Use $userPermissions shorthand so Svelte tracks changes
  $: sourceLinks = links.filter(l => {
    if (!l.perm) return true;
    return $userPermissions?.includes(l.perm);
  });

  // When allowed links change, schedule recalc after DOM updates
  // We use explicit subscription below as well for reliability on hard refresh.
  $: if (typeof window !== 'undefined' && navEl) {
    // small tick so bound nodes have layout settled
    tick().then(() => recalc());
  }

  // recalc: measure and split visible / overflow using sourceLinks
  function recalc() {
    if (!navEl || !leftEl || !rightEl || !logoEl) return;

    if (window.innerWidth < 768) {
      visible = [...sourceLinks];
      overflow = [];
      return;
    }

    const measurableLinks = [...sourceLinks];
    visible = [...measurableLinks];
    overflow = [];

    const containerWidth = navEl.clientWidth;
    const rightWidth = rightEl.clientWidth;
    const logoWidth = logoEl.clientWidth;
    const moreWidth = 88;
    const spacing = 24;
    const available = containerWidth - rightWidth - logoWidth - spacing;

    let used = 0;
    const tmpVisible: Link[] = [];
    const tmpOverflow: Link[] = [];

    const measurer = document.createElement('div');
    measurer.className = 'absolute -z-10 opacity-0 pointer-events-none flex gap-2';
    document.body.appendChild(measurer);

    for (const l of measurableLinks) {
      const b = document.createElement('button');
      b.className = 'px-3 py-2 text-sm font-medium rounded-xl';
      b.textContent = l.name;
      measurer.appendChild(b);
      const w = b.getBoundingClientRect().width;

      if (used + w + (tmpOverflow.length ? moreWidth : 0) > available) {
        tmpOverflow.push(l);
      } else {
        used += w;
        tmpVisible.push(l);
      }
    }
    document.body.removeChild(measurer);

    if (tmpOverflow.length) {
      while (used + moreWidth > available && tmpVisible.length) {
        const moved = tmpVisible.pop()!;
        tmpOverflow.unshift(moved);
        used -= Math.max(56, moved.name.length * 7);
      }
    }

    visible = tmpVisible;
    overflow = tmpOverflow;
  }

  function openLogoutConfirm() {
    showProfile = false;
    showMobile = false;
    showLogoutConfirm = true;
  }

  async function confirmLogout() {
    try {
      pendingLogout = true;
      try { await apiFetch('/auth/logout', { method: 'POST', auth: true }); } catch {}
    } finally {
      pendingLogout = false;
      setUser(null as any);
      setToken(null);
      goto('/auth/login');
    }
  }

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
  $: lockBodyScroll(showMobile);

  function onResize() {
    // small throttle guard not needed here; recalc is cheap
    recalc();
    if (window.innerWidth >= 768 && showMobile) showMobile = false;
  }

  onMount(() => {
    (async () => {
      try {
        const hasUser = !!get(currentUser);
        if (getToken() && !hasUser) {
          const me: any = await apiFetch('/auth/me', { method: 'POST', auth: true });
          if (me?.name || me?.email) setUser({ name: me.name ?? '', email: me.email ?? '' });
        }
      } catch (e) {
        // ignore errors
      }
    })();

    // observe nav bound changes (use ResizeObserver to trigger recalc)
    const ro = new ResizeObserver(() => recalc());
    if (navEl) ro.observe(navEl);

    // ensure we recalc after initial DOM paint + after any permission load
    // subscription: when permissions change, wait tick() then recalc
    const unsubPerm = (userPermissions as any).subscribe(async () => {
      await tick(); // wait DOM updates / bindings
      recalc();
    });

    const outsideClick = () => { showMore = false; showProfile = false; };
    document.addEventListener('click', outsideClick);

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && showMobile) showMobile = false;
    });

    // small initial delay to allow bindings (logoEl etc.) to be present
    setTimeout(() => recalc(), 50);

    return () => {
      ro.disconnect();
      unsubPerm();
      document.removeEventListener('click', outsideClick);
      window.removeEventListener('resize', onResize);
      lockBodyScroll(false);
    };
  });

  function go(href: string) {
    showMobile = false;
    showMore = false;
    goto(href);
  }
</script>

<div bind:this={navEl} class="sticky top-0 z-50" role="banner">
  <div class="backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-[#0b0617]/70 bg-white/90 dark:bg-[#0b0617]/90 border-b border-black/5 dark:border-white/10">
    <nav class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex h-[64px] items-center justify-between gap-2">
        <div class="flex items-center gap-3 min-w-0" bind:this={leftEl}>
          <a bind:this={logoEl} href="/" class="shrink-0 select-none font-semibold tracking-wide text-violet-700 dark:text-violet-300">
            INDOGREEN <span class="text-xs text-violet-700 dark:text-violet-300">V2</span>
          </a>

          <div class="hidden md:flex items-center gap-1">
            {#each visible as l (l.href)}
              <button
                type="button"
                on:click={() => go(l.href)}
                aria-current={isActive(l.href, $page.url.pathname) ? 'page' : undefined}
                class="px-3 py-2 rounded-full text-sm font-medium transition
                      text-slate-600 dark:text-slate-300
                      hover:bg-violet-500/10 dark:hover:bg-violet-400/10
                      {isActive(l.href, $page.url.pathname) ? 'bg-violet-500/15 dark:bg-violet-400/15' : ''}">
                {l.name}
              </button>
            {/each}

            {#if overflow.length}
              <div class="relative">
                <button
                  type="button"
                  on:click|stopPropagation={() => (showMore = !showMore)}
                  aria-haspopup="menu"
                  aria-expanded={showMore}
                  class="px-3 py-2 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-600/10">
                  More
                </button>
                {#if showMore}
                  <div class="absolute left-0 mt-2 w-56 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#12101d] shadow-xl p-2">
                    {#each overflow as l (l.href)}
                      <button
                        type="button"
                        class="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-violet-600/10 hover:text-violet-700 dark:hover:text-violet-300"
                        on:click={() => go(l.href)}>
                        {l.name}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <div class="flex items-center gap-2" bind:this={rightEl}>
          <ThemeToggle />

          <div class="relative">
            <button
              type="button"
              on:click|stopPropagation={() => (showProfile = !showProfile)}
              aria-haspopup="menu"
              aria-expanded={showProfile}
              class="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-slate-200">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5.006 5.006 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.5V21h16v-2.5C20 16.17 16.33 14 12 14Z"/></svg>
              <span class="hidden sm:block">Profil</span>
              <svg class="h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clip-rule="evenodd"/></svg>
            </button>

            {#if showProfile}
              <div 
                  class="absolute right-0 mt-2 w-64 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#12101d] shadow-xl p-2"
                  role="menu"
                  tabindex="-1"
                  on:click|stopPropagation
                  on:keydown={() => {}}
              >
                <div class="px-3 py-3 mb-1 rounded-xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="h-9 w-9 rounded-full bg-violet-600/20 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12a5 5 0 1 0-5-5 5.006 5.006 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.5V21h16v-2.5C20 16.17 16.33 14 12 14Z"/>
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {($currentUser && $currentUser.name) ? $currentUser.name : '—'}
                      </p>
                      <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {($currentUser && $currentUser.email) ? $currentUser.email : '—'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  on:click={() => go('/settings')}
                  class="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-violet-600/10 hover:text-violet-700 dark:hover:text-violet-300">
                  Pengaturan
                </button>
                <button
                  type="button"
                  on:click={openLogoutConfirm}
                  class="w-full text-left px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10">
                  Logout
                </button>
              </div>
            {/if}

          </div>

          <button
            type="button"
            class="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            on:click={() => (showMobile = true)}
            aria-label="Open menu"
            aria-controls="mobile-menu"
            aria-expanded={showMobile}
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
          </button>
        </div>
      </div>
    </nav>
  </div>

  {#if showMobile}
    <div class="fixed inset-0 z-50" aria-modal="true" role="dialog" id="mobile-menu">
      <button
        type="button"
        aria-label="Close menu"
        class="absolute inset-0 bg-black/50"
        on:click={() => (showMobile = false)}
        transition:fade={{ duration: 120 }}
      ></button>

      <div
        class="absolute left-0 top-0 h-full w-full bg-white/90 dark:bg-[#0e0c19]/90 backdrop-blur border-r border-black/5 dark:border-white/10 shadow-2xl overflow-y-auto overscroll-contain"
        transition:fly={{ x: -360, duration: 220, opacity: 0.2 }}
      >
        <div class="flex items-center justify-between px-5 sm:px-6 py-4">
          <span class="font-semibold tracking-wide text-violet-700 dark:text-violet-300">INDOGREEN</span>
          <button
            type="button"
            class="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            on:click={() => (showMobile = false)}
            aria-label="Close menu"
            title="Tutup"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.29-6.3Z"/></svg>
          </button>
        </div>

        <div class="px-4 pb-3">
          <ThemeToggle fullWidth />
        </div>

        <div class="px-4 space-y-1">
          {#each sourceLinks as l (l.href)}
            {#key $page.url.pathname}
              <button
                type="button"
                on:click={() => go(l.href)}
                aria-current={isActive(l.href, $page.url.pathname) ? 'page' : undefined}
                class="w-full text-left px-3 py-2 rounded-full text-sm font-medium
                      text-slate-700 dark:text-slate-200
                      hover:bg-violet-500/10 dark:hover:bg-violet-400/10
                      {isActive(l.href, $page.url.pathname) ? 'bg-violet-500/15 dark:bg-violet-400/15' : ''}">
                {l.name}
              </button>
            {/key}
          {/each}
        </div>

        <div class="px-2 pt-3 border-t border-black/5 dark:border-white/10 mt-3 pb-6">
          <button
            type="button"
            on:click={() => go('/settings')}
            class="group relative w-full text-left pl-5 pr-3 py-3 rounded-full text-sm text-slate-700 dark:text-slate-200 hover:bg-violet-600/10 hover:text-violet-700 dark:hover:text-violet-300">
            <span class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-violet-500/70 opacity-0 transition-opacity group-hover:opacity-100"></span>
            Pengaturan
          </button>
          <button
            type="button"
            on:click={openLogoutConfirm}
            class="group relative w-full text-left pl-5 pr-3 py-3 rounded-full text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10">
            <span class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-red-500/70 opacity-0 transition-opacity group-hover:opacity-100"></span>
            Logout
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<ConfirmDialog
  bind:open={showLogoutConfirm}
  title="Konfirmasi Logout"
  message="Anda akan keluar dari sesi ini. Pastikan semua perubahan sudah tersimpan."
  confirmText="Ya, Logout"
  cancelText="Batal"
  pending={pendingLogout}
  on:confirm={confirmLogout}
  on:cancel={() => (showLogoutConfirm = false)}
/>

<style>
  :global(.prevent-close) { pointer-events: auto; }
</style>