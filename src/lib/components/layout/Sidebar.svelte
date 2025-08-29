<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { page } from '$app/stores';
    import SidebarLink from './SidebarLink.svelte';
  
    const dispatch = createEventDispatcher();
  
    export let collapsed: boolean; // Prop untuk mengontrol collapse state
  
    function toggleCollapsed() {
      dispatch('toggleCollapsed');
    }
  
    function handleLogout() {
      dispatch('logout');
    }
  </script>
  
  <div
    class="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out bg-white text-gray-700 shadow-lg"
    class:lg:w-64={!collapsed}
    class:lg:w-20={collapsed}
  >
    <div class="flex min-h-0 flex-1 flex-col pt-5 pb-4">
      <div class="flex flex-shrink-0 items-center px-4" class:justify-center={collapsed}>
        <div
          class="flex items-center transition-all duration-200"
          class:opacity-0={collapsed}
          class:w-0={collapsed}
          class:overflow-hidden={collapsed}
        >
          <svg class="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="text-xl font-bold ml-2 text-indigo-600 whitespace-nowrap">INDOGREEN</span>
        </div>
  
        <button
          on:click={toggleCollapsed}
          class="text-gray-500 hover:text-gray-800 focus:outline-none transition-transform duration-200"
          class:ml-auto={!collapsed}
          class:ml-0={collapsed}
        >
          {#if !collapsed}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          {:else}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          {/if}
        </button>
      </div>
  
      <nav
        class="mt-5 flex-1 space-y-1 px-2"
      >
        <SidebarLink href="/dashboard" icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" {collapsed}>
          Dashboard
        </SidebarLink>
        <SidebarLink href="/projects" icon="M9 17v-2m3 2v-4m3 2v-6m2 9H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" {collapsed} routePrefix="projects">
          Project
        </SidebarLink>
        <SidebarLink href="/activities" icon="M8 7V3m8 4V3m-9 8h.01M17 11h.01M9 15h.01M15 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" {collapsed} routePrefix="activities">
          Activity
        </SidebarLink>
        <SidebarLink href="/mitras" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H2m2-9l4-4m-4 4l4 4m6 0h9m-9 0a3 3 0 110-6m0 6a3 3 0 100-6" {collapsed} routePrefix="mitras">
          Mitra
        </SidebarLink>
        <SidebarLink href="/barang-certificates" icon="M9 2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 19.5V8.25L13.5 2.25H9zM9 12h6m-6 4h3" {collapsed} routePrefix="barang-certificates">
          Barang Certificates
        </SidebarLink>
        <SidebarLink href="/certificates" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" {collapsed} routePrefix="certificates">
          Certificates
        </SidebarLink>
        <SidebarLink href="/settings" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" {collapsed} routePrefix="settings">
          Setting
        </SidebarLink>
      </nav>
  
      <div class="mt-auto px-2 pb-4">
        <button
          on:click={handleLogout}
          class="w-full text-red-500 hover:bg-red-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200"
          class:justify-center={collapsed}
        >
          <svg class="h-6 w-6 transition-transform duration-200" class:mr-0={collapsed} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {#if !collapsed}
            <span class="whitespace-nowrap ml-3">Logout</span>
          {/if}
        </button>
      </div>
    </div>
  </div>