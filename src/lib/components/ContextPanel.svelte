<script lang="ts">
  import Avatar from './Avatar.svelte';
  import ReminderChip from './ReminderChip.svelte';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import LinkIcon from '@lucide/svelte/icons/link';
  import BuildingIcon from '@lucide/svelte/icons/building';
  import AtSignIcon from '@lucide/svelte/icons/at-sign';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { SOURCES, decodeOpenTo, decodePlatform, type Contact } from '$lib/data';

  type Props = {
    contact: Contact | null;
    onOpenProfile: () => void;
  };
  let { contact, onOpenProfile }: Props = $props();

  let primaryExternal = $derived(
    contact?.sifa?.externalAccounts.find((e) => e.isPrimary) ??
      contact?.sifa?.externalAccounts[0] ??
      null
  );

  function tryHostname(u: string): string {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch {
      return u;
    }
  }
</script>

<aside class="panel">
  {#if contact}
    <header class="head">
      <Avatar
        initials={contact.initials}
        color={contact.avatarColor}
        size={54}
        ring
        imageUrl={contact.avatarUrl}
      />
      <h2 class="name">{contact.name}</h2>
      <p class="tag">{contact.tagline}</p>
      <button type="button" class="view-full" onclick={onOpenProfile}>View full profile</button>
    </header>

    <section class="block">
      <h3 class="block-title">Details</h3>
      <ul class="details">
        <li>
          <span class="d-icon"><AtSignIcon size={13} strokeWidth={2} /></span>
          <a href="https://bsky.app/profile/{contact.handle}" target="_blank" rel="noreferrer">
            {contact.handle}
          </a>
        </li>
        {#if contact.location}
          <li>
            <span class="d-icon"><MapPinIcon size={13} strokeWidth={2} /></span>
            <span>{contact.location}</span>
          </li>
        {/if}
        {#if contact.sifa?.self?.industry}
          <li>
            <span class="d-icon"><BuildingIcon size={13} strokeWidth={2} /></span>
            <span>{contact.sifa.self.industry}</span>
          </li>
        {/if}
        {#if primaryExternal}
          <li>
            <span class="d-icon"><LinkIcon size={13} strokeWidth={2} /></span>
            <a href={primaryExternal.url} target="_blank" rel="external noreferrer">
              {primaryExternal.label || tryHostname(primaryExternal.url)}
            </a>
          </li>
        {/if}
      </ul>
    </section>

    {#if contact.sifa?.self?.openTo && contact.sifa.self.openTo.length > 0}
      <section class="block">
        <h3 class="block-title">Open to</h3>
        <div class="open-chips">
          {#each contact.sifa.self.openTo as v (v)}
            <span class="open-chip">{decodeOpenTo(v)}</span>
          {/each}
        </div>
      </section>
    {/if}

    {#if contact.reminder}
      <section class="block">
        <h3 class="block-title">Reminder</h3>
        <ReminderChip reminder={contact.reminder} variant="embedded" />
      </section>
    {/if}

    {#if contact.sifa?.externalAccounts && contact.sifa.externalAccounts.length > 1}
      <section class="block">
        <h3 class="block-title">Links</h3>
        <ul class="ext-list">
          {#each contact.sifa.externalAccounts as ext, i (i)}
            <li>
              <a class="ext" href={ext.url} target="_blank" rel="external noreferrer">
                <span class="ext-label">{ext.label || tryHostname(ext.url)}</span>
                <span class="ext-platform">{decodePlatform(ext.platform)}</span>
                <ArrowUpRightIcon size={11} strokeWidth={2} />
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="block">
      <h3 class="block-title">Connected</h3>
      <ul class="sources">
        {#each contact.sources as src (src)}
          {@const cfg = SOURCES[src]}
          <li>
            <span class="src-dot" style:--c={cfg.color}></span>
            <span class="src-label">{cfg.label}</span>
            <span class="src-status">synced</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</aside>

<style>
  .panel {
    width: 280px;
    flex-shrink: 0;
    background: var(--surface);
    border-left: 1px solid var(--border-soft);
    overflow-y: auto;
    padding: 24px 20px 32px;
  }

  .head {
    text-align: center;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--border-soft);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .name {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 400;
    color: var(--text-strong);
    letter-spacing: -0.015em;
    line-height: 1.15;
    margin-top: 10px;
  }
  .tag {
    font-size: var(--fs-xs);
    color: var(--text-muted);
    margin-top: 3px;
  }
  .view-full {
    margin-top: 12px;
    font-size: var(--fs-xs);
    color: var(--text-muted);
    padding: 6px 14px;
    border-radius: var(--r-sm);
    box-shadow: inset 0 0 0 1px var(--border);
    transition: all var(--dur-fast);
  }
  .view-full:hover {
    color: var(--text-strong);
    background: var(--bg-dim);
    box-shadow: inset 0 0 0 1px var(--hairline);
  }

  .block {
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px solid var(--border-soft);
  }
  .block:first-of-type {
    border-top: none;
    margin-top: 0;
  }
  .block-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-subtle);
    letter-spacing: 0.11em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .details {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .details li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-sm);
    color: var(--text);
    min-width: 0;
  }
  .details li > a,
  .details li > span:not(.d-icon) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .d-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--bg-dim);
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .open-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .open-chip {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--amber-deep);
    background: var(--amber-tint);
    padding: 2px 8px;
    border-radius: 99px;
  }

  .ext-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ext {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: var(--r-sm);
    background: var(--bg-dim);
    color: var(--text);
    transition: background var(--dur-fast);
    min-width: 0;
  }
  .ext:hover {
    background: var(--surface-inset);
    text-decoration: none;
  }
  .ext-label {
    flex: 1;
    font-size: var(--fs-xs);
    color: var(--text-strong);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ext-platform {
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-subtle);
  }
  .ext :global(svg) {
    color: var(--text-subtle);
  }

  .sources {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .sources li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-sm);
    color: var(--text);
  }
  .src-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
    flex-shrink: 0;
  }
  .src-label {
    flex: 1;
    font-weight: 500;
  }
  .src-status {
    font-size: 10px;
    color: var(--text-subtle);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
</style>
