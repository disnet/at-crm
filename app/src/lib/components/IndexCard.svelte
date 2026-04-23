<script lang="ts">
  import Avatar from './Avatar.svelte';
  import SourceChip from './SourceChip.svelte';
  import {
    SOURCES,
    isMessage,
    type Contact,
    type Message,
    type NoteEntry,
    type SourceKey
  } from '$lib/data';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import PhoneIcon from '@lucide/svelte/icons/phone';
  import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
  import HandshakeIcon from '@lucide/svelte/icons/handshake';
  import BellIcon from '@lucide/svelte/icons/bell';

  type Props = {
    contact: Contact;
    onSwitchSource: (s: SourceKey) => void;
    onOpenProfile: () => void;
  };
  let { contact, onSwitchSource, onOpenProfile }: Props = $props();

  let lastReceived = $derived.by(() => {
    let latest: { msg: Message; source: SourceKey } | null = null;
    for (const [src, entries] of Object.entries(contact.threads)) {
      const srcKey = src as SourceKey;
      const msgs = entries?.filter(isMessage).filter((m) => m.dir === 'in') ?? [];
      const last = msgs[msgs.length - 1];
      if (last) latest = { msg: last, source: srcKey };
    }
    return latest;
  });

  let prevTouchpoint = $derived.by(() => {
    const all: NoteEntry[] = [];
    for (const entries of Object.values(contact.threads)) {
      if (!entries) continue;
      for (const e of entries) {
        if ('type' in e && e.type !== 'reminder') all.push(e);
      }
    }
    return all[all.length - 1] ?? null;
  });
</script>

<div class="index">
  <!-- Header card with profile gist -->
  <section class="gist">
    <Avatar
      initials={contact.initials}
      color={contact.avatarColor}
      size={56}
      ring
      imageUrl={contact.avatarUrl}
    />
    <div class="gist-body">
      <h2 class="gist-name">{contact.name}</h2>
      <div class="gist-tag">{contact.tagline}</div>
      {#if contact.location}
        <div class="gist-loc">
          <MapPinIcon size={11} strokeWidth={2.2} />
          <span>{contact.location}</span>
        </div>
      {/if}
    </div>
    <div class="gist-right">
      <div class="src-dots">
        {#each contact.sources as src (src)}
          <button
            type="button"
            class="src-dot"
            style:--c={SOURCES[src].color}
            aria-label="Switch to {SOURCES[src].label}"
            onclick={() => onSwitchSource(src)}
          ></button>
        {/each}
      </div>
      <button type="button" class="profile-btn" onclick={onOpenProfile}>
        <span>Profile</span>
        <ArrowRightIcon size={12} strokeWidth={2} />
      </button>
    </div>
  </section>

  <!-- Last message -->
  <section class="card last-msg">
    <header class="card-head">
      <span class="label">Last heard from them</span>
      {#if lastReceived}
        <div class="card-meta">
          <SourceChip source={lastReceived.source} />
          <span class="ts">
            {#if lastReceived.msg.date && lastReceived.msg.date !== lastReceived.msg.ts}
              {lastReceived.msg.date} · {lastReceived.msg.ts}
            {:else}
              {lastReceived.msg.ts}
            {/if}
          </span>
        </div>
      {/if}
    </header>
    {#if lastReceived}
      <blockquote class="quote">
        <span class="mark" aria-hidden="true">"</span>
        <p>{lastReceived.msg.text}</p>
      </blockquote>
    {:else}
      <p class="empty">No messages yet — this is a fresh page.</p>
    {/if}
  </section>

  <!-- Previous touchpoint -->
  <section class="card prev">
    <header class="card-head">
      <span class="label">Previously in your notes</span>
    </header>
    {#if prevTouchpoint}
      <div class="touch">
        <span class="touch-icon" data-type={prevTouchpoint.type}>
          {#if prevTouchpoint.type === 'call'}
            <PhoneIcon size={13} strokeWidth={2} />
          {:else if prevTouchpoint.type === 'meeting'}
            <HandshakeIcon size={13} strokeWidth={2} />
          {:else if prevTouchpoint.type === 'reminder'}
            <BellIcon size={13} strokeWidth={2} />
          {:else}
            <StickyNoteIcon size={13} strokeWidth={2} />
          {/if}
        </span>
        <div class="touch-body">
          <p class="touch-text">{prevTouchpoint.text}</p>
          <div class="touch-ts">{prevTouchpoint.ts}</div>
        </div>
      </div>
    {:else}
      <p class="empty">Nothing logged yet. Drop a note when you talk next.</p>
    {/if}
  </section>
</div>

<style>
  .index {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 620px;
    width: 100%;
    margin: 0 auto;
  }

  /* Gist — hero card */
  .gist {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 18px 20px;
    border-radius: var(--r-lg);
    background: var(--surface);
    box-shadow: var(--elev-2);
  }
  .gist-body {
    flex: 1;
    min-width: 0;
  }
  .gist-name {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 400;
    color: var(--text-strong);
    letter-spacing: -0.015em;
    line-height: 1.1;
  }
  .gist-tag {
    font-size: var(--fs-sm);
    color: var(--text-muted);
    margin-top: 4px;
  }
  .gist-loc {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-xs);
    color: var(--text-subtle);
    margin-top: 6px;
  }
  .gist-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    flex-shrink: 0;
  }
  .src-dots {
    display: flex;
    gap: 5px;
  }
  .src-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--c);
    padding: 0;
    transition: transform var(--dur-fast) var(--ease-out-quart);
    box-shadow: inset 0 0 0 1px oklch(100% 0 0 / 0.2);
  }
  .src-dot:hover {
    transform: scale(1.15);
  }
  .profile-btn {
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
  .profile-btn:hover {
    color: var(--text-strong);
    background: var(--bg-dim);
    box-shadow: inset 0 0 0 1px var(--hairline);
  }

  /* Cards */
  .card {
    padding: 16px 18px 18px;
    border-radius: var(--r-lg);
    background: var(--surface);
    box-shadow: var(--elev-1);
  }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }
  .card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ts {
    font-size: 10.5px;
    color: var(--text-subtle);
    font-variant-numeric: tabular-nums;
  }

  /* Quote block */
  .quote {
    position: relative;
    padding: 12px 16px 12px 28px;
    background: var(--bg-dim);
    border-radius: var(--r-md);
  }
  .mark {
    position: absolute;
    left: 10px;
    top: 4px;
    font-family: var(--font-display);
    font-size: 36px;
    color: var(--accent);
    opacity: 0.45;
    line-height: 1;
  }
  .quote p {
    font-size: var(--fs-base);
    color: var(--text);
    line-height: 1.55;
  }
  .empty {
    font-size: var(--fs-sm);
    color: var(--text-subtle);
    font-style: italic;
  }

  /* Touchpoint */
  .touch {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .touch-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--surface-inset);
    color: var(--text-muted);
    flex-shrink: 0;
    margin-top: 1px;
  }
  .touch-icon[data-type='call'] {
    background: var(--src-signal-bg);
    color: var(--src-signal);
  }
  .touch-icon[data-type='meeting'] {
    background: var(--accent-wash);
    color: var(--accent-ink);
  }
  .touch-icon[data-type='reminder'] {
    background: var(--amber-tint);
    color: var(--amber-deep);
  }
  .touch-icon[data-type='note'] {
    background: var(--src-notes-bg);
    color: var(--src-notes);
  }
  .touch-body {
    flex: 1;
    min-width: 0;
  }
  .touch-text {
    font-size: var(--fs-sm);
    color: var(--text);
    line-height: 1.55;
  }
  .touch-ts {
    font-size: 10.5px;
    color: var(--text-subtle);
    margin-top: 5px;
    font-variant-numeric: tabular-nums;
  }
</style>
