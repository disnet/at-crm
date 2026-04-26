<script lang="ts">
  import Avatar from './Avatar.svelte';
  import ContactRow from './ContactRow.svelte';
  import IconBtn from './IconBtn.svelte';
  import SearchIcon from '@lucide/svelte/icons/search';
  import BellIcon from '@lucide/svelte/icons/bell';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import LoaderIcon from '@lucide/svelte/icons/loader-circle';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import type { Contact } from '$lib/data';
  import type { AuthUser } from '$lib/auth';

  type Props = {
    contacts: Contact[];
    activeId: string | null;
    user: AuthUser;
    signingOut?: boolean;
    syncingMutuals?: boolean;
    syncingDMs?: boolean;
    onSelect: (id: string) => void;
    onSearch: () => void;
    onReminders: () => void;
    onAddPerson: () => void;
    onSignOut: () => void;
  };
  let {
    contacts,
    activeId,
    user,
    signingOut = false,
    syncingMutuals = false,
    syncingDMs = false,
    onSelect,
    onSearch,
    onReminders,
    onAddPerson,
    onSignOut
  }: Props = $props();

  let meName = $derived(user.displayName?.trim() || user.handle);
  let meInitials = $derived(
    (user.displayName?.trim() || user.handle)
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '··'
  );

  let totalReminders = $derived(contacts.filter((c) => c.reminder).length);

  let groups = $derived.by(() => {
    const withUnread = contacts.filter((c) => c.unread > 0);
    const rest = contacts.filter((c) => c.unread === 0);
    return { withUnread, rest };
  });
</script>

<aside class="sidebar">
  <header class="head">
    <div class="brand">
      <span class="brand-name">People</span>
      <span class="brand-count">{contacts.length}</span>
    </div>
    <div class="head-actions">
      <IconBtn label="Reminders" onclick={onReminders} badge={totalReminders}>
        <BellIcon size={16} strokeWidth={2} />
      </IconBtn>
      <IconBtn label="Add person" onclick={onAddPerson}>
        <PlusIcon size={17} strokeWidth={2} />
      </IconBtn>
    </div>
  </header>

  <div class="search-wrap">
    <button type="button" class="search-btn" onclick={onSearch}>
      <SearchIcon size={14} strokeWidth={2} />
      <span>Search people, messages…</span>
      <kbd>⌘K</kbd>
    </button>
  </div>

  {#if syncingMutuals}
    <div class="sync-pill" role="status">
      <span class="spin"><LoaderIcon size={11} strokeWidth={2.2} /></span>
      <span>Finding atmosphere mutuals…</span>
    </div>
  {:else if syncingDMs}
    <div class="sync-pill" role="status">
      <span class="spin"><LoaderIcon size={11} strokeWidth={2.2} /></span>
      <span>Reading Bluesky DMs…</span>
    </div>
  {/if}

  <div class="list">
    {#if contacts.length === 0}
      <div class="empty">
        <p class="empty-title">No one here yet.</p>
        <p class="empty-body">
          Tap <button type="button" class="empty-plus" onclick={onAddPerson} aria-label="Add person"
            >+</button
          > to look up someone by their Bluesky handle.
        </p>
      </div>
    {/if}

    {#if groups.withUnread.length > 0}
      <div class="group-head">
        <span class="group-label">Waiting for you</span>
        <span class="group-count">{groups.withUnread.length}</span>
      </div>
      {#each groups.withUnread as contact (contact.id)}
        <ContactRow
          {contact}
          active={contact.id === activeId}
          onclick={() => onSelect(contact.id)}
        />
      {/each}
    {/if}

    {#if groups.rest.length > 0}
      <div class="group-head">
        <span class="group-label">Recent</span>
        <span class="group-count">{groups.rest.length}</span>
      </div>
      {#each groups.rest as contact (contact.id)}
        <ContactRow
          {contact}
          active={contact.id === activeId}
          onclick={() => onSelect(contact.id)}
        />
      {/each}
    {/if}
  </div>

  <footer class="foot">
    {#if user.avatar}
      <img class="me-avatar" src={user.avatar} alt="" />
    {:else}
      <Avatar initials={meInitials} color="var(--accent)" size={28} />
    {/if}
    <div class="me">
      <div class="me-name">{meName}</div>
      <div class="me-sub">@{user.handle}</div>
    </div>
    <IconBtn
      label={signingOut ? 'Signing out…' : 'Sign out'}
      onclick={signingOut ? () => {} : onSignOut}
    >
      {#if signingOut}
        <span class="spin"><LoaderIcon size={15} strokeWidth={2} /></span>
      {:else}
        <LogOutIcon size={15} strokeWidth={2} />
      {/if}
    </IconBtn>
  </footer>
</aside>

<style>
  .sidebar {
    width: 272px;
    background: var(--surface-alt);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
    position: relative;
    z-index: 1;
    box-shadow: inset -1px 0 0 var(--border);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 16px 12px 10px 16px;
  }
  .brand {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .brand-name {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 400;
    color: var(--text-strong);
    letter-spacing: -0.01em;
  }
  .brand-count {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--text-subtle);
    background: oklch(90% 0.022 62);
    padding: 2px 7px;
    border-radius: 99px;
    font-variant-numeric: tabular-nums;
  }
  .head-actions {
    display: flex;
    gap: 2px;
  }

  .search-wrap {
    padding: 2px 12px 12px;
  }
  .search-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px 7px 11px;
    border-radius: var(--r-sm);
    background: oklch(92% 0.02 62);
    color: var(--text-subtle);
    font-size: var(--fs-xs);
    transition: background var(--dur-fast);
  }
  .search-btn:hover {
    background: oklch(90% 0.024 62);
    color: var(--text-muted);
  }
  .search-btn span {
    flex: 1;
    text-align: left;
  }
  kbd {
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-subtle);
    background: var(--surface);
    padding: 2px 6px;
    border-radius: 4px;
    box-shadow: 0 0 0 1px var(--border);
  }

  .sync-pill {
    margin: 0 12px 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: var(--r-pill);
    background: var(--accent-wash);
    color: var(--accent-ink);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    align-self: flex-start;
    width: fit-content;
  }

  .list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 12px;
  }

  .empty {
    padding: 28px 18px 12px;
    text-align: center;
  }
  .empty-title {
    font-family: var(--font-display);
    font-size: var(--fs-md);
    font-weight: 400;
    color: var(--text-strong);
    letter-spacing: -0.01em;
    margin-bottom: 6px;
  }
  .empty-body {
    font-size: var(--fs-xs);
    color: var(--text-muted);
    line-height: 1.6;
  }
  .empty-plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 5px;
    background: var(--accent-wash);
    color: var(--accent-ink);
    font-weight: 700;
    vertical-align: -3px;
    margin: 0 1px;
    transition: background var(--dur-fast);
  }
  .empty-plus:hover {
    background: var(--accent-tint);
  }

  .group-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 14px 10px 6px;
  }
  .group-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--text-subtle);
  }
  .group-count {
    font-size: 10px;
    color: var(--text-subtle);
    font-variant-numeric: tabular-nums;
  }

  .foot {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 14px 18px;
    border-top: 1px solid var(--border);
    background: oklch(92% 0.024 62);
  }
  .me {
    flex: 1;
    min-width: 0;
  }
  .me-name {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.005em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .me-sub {
    font-size: 10.5px;
    color: var(--text-muted);
    margin-top: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .me-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow:
      inset 0 0 0 1px oklch(100% 0 0 / 0.1),
      var(--elev-1);
  }
  .spin {
    display: inline-flex;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
