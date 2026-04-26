<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import ThreadView from '$lib/components/ThreadView.svelte';
  import ContextPanel from '$lib/components/ContextPanel.svelte';
  import ProfileView from '$lib/components/ProfileView.svelte';
  import SearchOverlay from '$lib/components/SearchOverlay.svelte';
  import RemindersPanel from '$lib/components/RemindersPanel.svelte';
  import QuickCapture from '$lib/components/QuickCapture.svelte';
  import AddPersonOverlay from '$lib/components/AddPersonOverlay.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { liveQuery, type Subscription } from 'dexie';
  import { db, syncAtmosphereMutuals } from '$lib/db';
  import type { Contact } from '$lib/data';
  import { getUser, clearUser, type AuthUser } from '$lib/auth';
  import { getOAuthClient } from '$lib/oauth';

  type Screen = 'thread' | 'profile';

  let contacts = $state<Contact[]>([]);
  let activeId = $state<string | null>(null);
  let screen = $state<Screen>('thread');
  let searchOpen = $state(false);
  let remindersOpen = $state(false);
  let quickOpen = $state(false);
  let addPersonOpen = $state(false);
  let contextCollapsed = $state(true);
  let user = $state<AuthUser | null>(null);
  let signingOut = $state(false);
  let syncingMutuals = $state(false);
  const syncAbort = new AbortController();

  let activeContact = $derived((activeId && contacts.find((c) => c.id === activeId)) || null);

  onMount(() => {
    const u = getUser();
    if (!u) {
      goto('/login');
      return;
    }
    user = u;

    try {
      const saved = localStorage.getItem('crm_activeId');
      if (saved) activeId = saved;
      contextCollapsed = localStorage.getItem('crm_contextVisible') !== '1';
      localStorage.removeItem('crm_contextCollapsed');
    } catch {
      // localStorage unavailable (private mode, quota, etc.)
    }

    const sub: Subscription = liveQuery(() => db.contacts.orderBy('order').toArray()).subscribe({
      next: (val) => {
        contacts = val;
        if (activeId && !val.some((c) => c.id === activeId)) activeId = null;
        if (!activeId && val.length > 0) activeId = val[0].id;
      }
    });

    syncingMutuals = true;
    syncAtmosphereMutuals(u, { signal: syncAbort.signal })
      .then((result) => {
        const capped = Object.keys(result.truncated);
        if (capped.length > 0) {
          console.warn(
            `Atmosphere mutual sync hit pagination caps for: ${capped.join(', ')}. ` +
              'Some mutuals may be missing — see FOLLOW_CAP / BSKY_GRAPH_MAX_PAGES.'
          );
        }
      })
      .catch((err) => {
        if (syncAbort.signal.aborted) return;
        console.warn('Atmosphere mutual sync failed', err);
      })
      .finally(() => {
        syncingMutuals = false;
      });

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchOpen = true;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      syncAbort.abort();
      sub.unsubscribe();
      window.removeEventListener('keydown', onKey);
    };
  });

  $effect(() => {
    try {
      if (activeId) localStorage.setItem('crm_activeId', activeId);
      else localStorage.removeItem('crm_activeId');
    } catch {
      // localStorage unavailable (private mode, quota, etc.)
    }
  });

  $effect(() => {
    try {
      if (contextCollapsed) localStorage.removeItem('crm_contextVisible');
      else localStorage.setItem('crm_contextVisible', '1');
    } catch {
      // localStorage unavailable (private mode, quota, etc.)
    }
  });

  function selectContact(id: string) {
    activeId = id;
    screen = 'thread';
  }

  async function signOut() {
    if (signingOut) return;
    signingOut = true;
    syncAbort.abort();
    const u = user;
    try {
      if (u) {
        try {
          const client = await getOAuthClient();
          await client.revoke(u.did);
        } catch (err) {
          console.warn('Remote revoke failed; clearing local session anyway', err);
        }
      }
    } finally {
      clearUser();
      user = null;
      signingOut = false;
      await goto('/login');
    }
  }
</script>

{#if user}
<div class="shell">
  <Sidebar
    {contacts}
    {activeId}
    {user}
    {signingOut}
    {syncingMutuals}
    onSelect={selectContact}
    onSearch={() => (searchOpen = true)}
    onReminders={() => (remindersOpen = true)}
    onAddPerson={() => (addPersonOpen = true)}
    onSignOut={signOut}
  />

  {#if screen === 'profile' && activeContact}
    <ProfileView contact={activeContact} onBack={() => (screen = 'thread')} />
  {:else}
    <ThreadView
      contact={activeContact}
      onOpenProfile={() => (screen = 'profile')}
      onQuickCapture={() => (quickOpen = true)}
      {contextCollapsed}
      onToggleContext={() => (contextCollapsed = !contextCollapsed)}
    />
    {#if !contextCollapsed}
      <ContextPanel contact={activeContact} onOpenProfile={() => (screen = 'profile')} />
    {/if}
  {/if}
</div>

{#if searchOpen}
  <SearchOverlay {contacts} onClose={() => (searchOpen = false)} onSelect={selectContact} />
{/if}
{#if remindersOpen}
  <RemindersPanel {contacts} onClose={() => (remindersOpen = false)} onSelect={selectContact} />
{/if}
{#if quickOpen}
  <QuickCapture onClose={() => (quickOpen = false)} />
{/if}
{#if addPersonOpen}
  <AddPersonOverlay onClose={() => (addPersonOpen = false)} onAdded={selectContact} />
{/if}
{/if}

<style>
  .shell {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }
</style>
