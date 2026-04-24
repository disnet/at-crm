<script lang="ts">
  import Avatar from './Avatar.svelte';
  import MessageBubble from './MessageBubble.svelte';
  import NoteEntryCard from './NoteEntry.svelte';
  import SourcePill from './SourcePill.svelte';
  import IndexCard from './IndexCard.svelte';
  import SendIcon from '@lucide/svelte/icons/send-horizontal';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import UserIcon from '@lucide/svelte/icons/user';
  import BellIcon from '@lucide/svelte/icons/bell';
  import XIcon from '@lucide/svelte/icons/x';
  import UsersIcon from '@lucide/svelte/icons/users-round';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import PanelRightCloseIcon from '@lucide/svelte/icons/panel-right-close';
  import PanelRightOpenIcon from '@lucide/svelte/icons/panel-right-open';
  import {
    isMessage,
    isNote,
    type Contact,
    type Message,
    type NoteEntry,
    type SourceKey
  } from '$lib/data';
  import { addNote, sendMockMessage } from '$lib/db';

  type Props = {
    contact: Contact | null;
    onOpenProfile: () => void;
    onQuickCapture: () => void;
    contextCollapsed: boolean;
    onToggleContext: () => void;
  };
  let { contact, onOpenProfile, onQuickCapture, contextCollapsed, onToggleContext }: Props =
    $props();

  type View = 'index' | SourceKey;
  let activeSource = $state<View>('index');
  let inputVal = $state('');
  let scrollEl = $state<HTMLDivElement | null>(null);
  let reminderDismissed = $state(false);

  let lastContactId: string | null = null;
  $effect(() => {
    const id = contact?.id ?? null;
    if (id === lastContactId) return;
    lastContactId = id;
    activeSource = 'index';
    inputVal = '';
    reminderDismissed = false;
  });

  $effect(() => {
    void activeSource;
    void displayMessages.length;
    if (scrollEl) {
      queueMicrotask(() => {
        if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
      });
    }
  });

  let displayMessages = $derived.by(() => {
    if (!contact || activeSource === 'index') return [];
    const entries = contact.threads[activeSource as SourceKey] ?? [];
    return entries.map((m) => ({ ...m, source: activeSource as SourceKey }));
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const text = inputVal.trim();
    if (!contact || !text) return;
    inputVal = '';
    if (activeSource === 'index' || activeSource === 'notes') {
      await addNote(contact.id, text);
    } else {
      await sendMockMessage(contact.id, activeSource as SourceKey, text);
    }
  }

  function placeholder() {
    if (!contact) return 'Say something…';
    if (activeSource === 'index') return 'Write a note…';
    if (activeSource === 'notes') return 'Add a note, call log, reminder…';
    return `Message via ${activeSource}…`;
  }
</script>

<main class="thread">
  {#if !contact}
    <div class="empty-stage">
      <div class="empty-art">
        <UsersIcon size={44} strokeWidth={1.3} />
      </div>
      <h2 class="empty-title">Take a breath.</h2>
      <p class="empty-body">
        Pick someone from the list.<br />
        Their threads, notes, and next steps will be here.
      </p>
    </div>
  {:else}
    <!-- Header: compact contact bar -->
    <header class="head">
      <Avatar
        initials={contact.initials}
        color={contact.avatarColor}
        size={36}
        imageUrl={contact.avatarUrl}
      />
      <div class="head-text">
        <div class="head-name">{contact.name}</div>
        <div class="head-tag">{contact.tagline}</div>
      </div>
      <button type="button" class="head-profile" onclick={onOpenProfile}>
        <UserIcon size={13} strokeWidth={2} />
        <span>Profile</span>
      </button>
      <button
        type="button"
        class="head-toggle"
        onclick={onToggleContext}
        aria-label={contextCollapsed ? 'Show details panel' : 'Hide details panel'}
        aria-pressed={!contextCollapsed}
        title={contextCollapsed ? 'Show details' : 'Hide details'}
      >
        {#if contextCollapsed}
          <PanelRightOpenIcon size={15} strokeWidth={2} />
        {:else}
          <PanelRightCloseIcon size={15} strokeWidth={2} />
        {/if}
      </button>
    </header>

    <!-- Source tabs -->
    <nav class="tabs" aria-label="Channels">
      <button
        type="button"
        class="tab tab-index"
        class:active={activeSource === 'index'}
        onclick={() => (activeSource = 'index')}
      >
        <BookOpenIcon size={12} strokeWidth={2.2} />
        <span>Index</span>
      </button>
      <span class="tabs-sep"></span>
      {#each contact.sources as src (src)}
        <SourcePill
          source={src}
          active={activeSource === src}
          onclick={() => (activeSource = src)}
        />
      {/each}
    </nav>

    <!-- Sticky reminder -->
    {#if contact.reminder && !reminderDismissed}
      <div class="reminder-bar">
        <span class="reminder-icon">
          <BellIcon size={12} strokeWidth={2.2} />
        </span>
        <div class="reminder-body">
          <span class="reminder-text">{contact.reminder.text}</span>
          <span class="reminder-due">{contact.reminder.due}</span>
        </div>
        <button
          type="button"
          class="reminder-dismiss"
          aria-label="Dismiss"
          onclick={() => (reminderDismissed = true)}
        >
          <XIcon size={12} strokeWidth={2} />
        </button>
      </div>
    {/if}

    <!-- Messages / Index -->
    <div class="scroll" bind:this={scrollEl}>
      {#if activeSource === 'index'}
        <div class="stage-pad">
          <IndexCard {contact} onSwitchSource={(s) => (activeSource = s)} {onOpenProfile} />
        </div>
      {:else if activeSource === 'notes'}
        <div class="notes-stack">
          {#each displayMessages as entry (entry.id)}
            {#if isNote(entry)}
              <NoteEntryCard entry={entry as NoteEntry} />
            {/if}
          {/each}
        </div>
      {:else}
        <div class="msg-stack">
          {#each displayMessages as entry (entry.id)}
            {#if isMessage(entry)}
              <MessageBubble msg={entry as Message} source={activeSource as SourceKey} />
            {/if}
          {/each}
          <div class="msg-tail"></div>
        </div>
      {/if}
    </div>

    <!-- Compose -->
    <form class="compose" onsubmit={handleSubmit}>
      <div class="compose-field">
        <input
          type="text"
          placeholder={placeholder()}
          bind:value={inputVal}
          aria-label="Message or note"
        />
        <button
          type="button"
          class="compose-capture"
          aria-label="Quick capture"
          title="Quick capture"
          onclick={onQuickCapture}
        >
          <ZapIcon size={14} strokeWidth={2.2} />
        </button>
      </div>
      <button type="submit" class="compose-send" disabled={!inputVal.trim()}>
        <SendIcon size={14} strokeWidth={2.2} />
        <span>Send</span>
      </button>
    </form>
  {/if}
</main>

<style>
  .thread {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--bg);
    position: relative;
  }

  /* Empty stage */
  .empty-stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    text-align: center;
  }
  .empty-art {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background: var(--surface);
    box-shadow: var(--elev-1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-subtle);
    margin-bottom: 18px;
  }
  .empty-title {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 400;
    color: var(--text-strong);
    letter-spacing: -0.015em;
  }
  .empty-body {
    margin-top: 10px;
    font-size: var(--fs-base);
    color: var(--text-muted);
    line-height: 1.7;
  }

  /* Head */
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border-soft);
    flex-shrink: 0;
  }
  .head-text {
    flex: 1;
    min-width: 0;
  }
  .head-name {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 400;
    color: var(--text-strong);
    letter-spacing: -0.015em;
    line-height: 1.15;
  }
  .head-tag {
    font-size: var(--fs-xs);
    color: var(--text-muted);
    margin-top: 1px;
  }
  .head-profile {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--fs-xs);
    color: var(--text-muted);
    padding: 5px 10px;
    border-radius: var(--r-sm);
    box-shadow: inset 0 0 0 1px var(--border);
    transition: all var(--dur-fast);
  }
  .head-profile:hover {
    color: var(--text-strong);
    background: var(--bg-dim);
  }
  .head-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--r-sm);
    color: var(--text-muted);
    transition:
      color var(--dur-fast),
      background var(--dur-fast);
  }
  .head-toggle:hover {
    color: var(--text-strong);
    background: var(--bg-dim);
  }
  .head-toggle[aria-pressed='false'] {
    color: var(--text-subtle);
  }

  /* Tabs */
  .tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    background: var(--surface);
    border-bottom: 1px solid var(--border-soft);
    flex-shrink: 0;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px 4px 10px;
    border-radius: var(--r-pill);
    color: var(--text-muted);
    font-size: var(--fs-xs);
    font-weight: 500;
    transition: all var(--dur-fast);
    line-height: 1;
  }
  .tab:hover {
    background: var(--bg-dim);
    color: var(--text-strong);
  }
  .tab.active {
    background: var(--text-strong);
    color: var(--bg);
  }
  .tabs-sep {
    width: 1px;
    height: 18px;
    background: var(--border);
    margin: 0 4px;
  }

  /* Reminder bar */
  .reminder-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px 9px 14px;
    background: var(--amber-wash);
    border-bottom: 1px solid oklch(86% 0.06 78 / 0.5);
    flex-shrink: 0;
  }
  .reminder-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--amber-tint);
    color: var(--amber-deep);
  }
  .reminder-body {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .reminder-text {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--amber-deep);
  }
  .reminder-due {
    font-size: var(--fs-xs);
    color: oklch(58% 0.09 76);
  }
  .reminder-dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    color: oklch(58% 0.08 76);
    transition: all var(--dur-fast);
  }
  .reminder-dismiss:hover {
    background: oklch(88% 0.07 76 / 0.5);
    color: var(--amber-deep);
  }

  /* Scroll */
  .scroll {
    flex: 1;
    overflow-y: auto;
    padding: 24px 24px 28px;
    position: relative;
  }
  .stage-pad {
    padding-top: 8px;
  }
  .msg-stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: 820px;
    margin: 0 auto;
  }
  .msg-tail {
    height: 8px;
  }
  .notes-stack {
    max-width: 620px;
    margin: 0 auto;
    padding: 4px 4px;
    background: var(--surface);
    border-radius: var(--r-lg);
    padding: 8px 20px;
    box-shadow: var(--elev-1);
  }

  /* Compose */
  .compose {
    display: flex;
    gap: 10px;
    align-items: stretch;
    padding: 12px 20px 16px;
    background: var(--surface);
    border-top: 1px solid var(--border-soft);
    flex-shrink: 0;
  }
  .compose-field {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background: var(--bg-dim);
    border-radius: var(--r-md);
    box-shadow: inset 0 0 0 1px var(--border);
    transition: box-shadow var(--dur-fast);
  }
  .compose-field:focus-within {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .compose-field input {
    flex: 1;
    padding: 10px 40px 10px 14px;
    font-size: var(--fs-base);
    color: var(--text);
    background: none;
    border: 0;
    outline: 0;
    min-width: 0;
  }
  .compose-field input::placeholder {
    color: var(--text-subtle);
  }
  .compose-capture {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-subtle);
    border-radius: 6px;
    transition: all var(--dur-fast);
  }
  .compose-capture:hover {
    color: var(--accent);
    background: var(--accent-wash);
  }
  .compose-send {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    background: var(--accent);
    color: oklch(99% 0 0);
    font-size: var(--fs-sm);
    font-weight: 600;
    border-radius: var(--r-md);
    transition: all var(--dur-fast);
    box-shadow: 0 1px 2px oklch(50% 0.12 40 / 0.18);
  }
  .compose-send:hover:not(:disabled) {
    background: var(--accent-deep);
  }
  .compose-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
