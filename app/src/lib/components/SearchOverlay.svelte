<script lang="ts">
  import Overlay from './Overlay.svelte';
  import Avatar from './Avatar.svelte';
  import SourceDot from './SourceDot.svelte';
  import SearchIcon from '@lucide/svelte/icons/search';
  import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
  import { isMessage, type Contact } from '$lib/data';

  type Props = {
    contacts: Contact[];
    onClose: () => void;
    onSelect: (id: string) => void;
  };
  let { contacts, onClose, onSelect }: Props = $props();

  let query = $state('');
  let inputEl = $state<HTMLInputElement | null>(null);
  let selected = $state(0);

  $effect(() => {
    inputEl?.focus();
  });

  let results = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.tagline.toLowerCase().includes(q)) return true;
      for (const entries of Object.values(c.threads)) {
        if (!entries) continue;
        for (const e of entries) {
          if (isMessage(e) && e.text.toLowerCase().includes(q)) return true;
          if (!isMessage(e) && e.text.toLowerCase().includes(q)) return true;
        }
      }
      return false;
    });
  });

  $effect(() => {
    void query;
    selected = 0;
  });

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selected = Math.min(selected + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selected = Math.max(selected - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = results[selected];
      if (c) {
        onSelect(c.id);
        onClose();
      }
    }
  }
</script>

<Overlay {onClose}>
  <div class="search">
    <div class="head">
      <SearchIcon size={16} strokeWidth={2} />
      <input
        bind:this={inputEl}
        bind:value={query}
        placeholder="Search people, messages, notes…"
        onkeydown={onKey}
      />
      <kbd>Esc</kbd>
    </div>
    <div class="list">
      {#if results.length === 0}
        <div class="empty">
          <p>Nothing matches <em>"{query}"</em>.</p>
        </div>
      {:else}
        {#each results as c, i (c.id)}
          <button
            type="button"
            class="hit"
            class:active={i === selected}
            onclick={() => {
              onSelect(c.id);
              onClose();
            }}
            onmouseenter={() => (selected = i)}
          >
            <Avatar initials={c.initials} color={c.avatarColor} size={34} imageUrl={c.avatarUrl} />
            <div class="hit-body">
              <div class="hit-name">{c.name}</div>
              <div class="hit-tag">{c.tagline}</div>
            </div>
            <div class="hit-dots">
              {#each c.sources as src (src)}
                <SourceDot source={src} size={6} />
              {/each}
            </div>
            {#if i === selected}
              <span class="hit-enter"><CornerDownLeftIcon size={12} strokeWidth={2} /></span>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  </div>
</Overlay>

<style>
  .search {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-soft);
    color: var(--text-subtle);
  }
  .head input {
    flex: 1;
    font-size: var(--fs-md);
    color: var(--text);
    background: none;
    border: 0;
  }
  .head input::placeholder {
    color: var(--text-subtle);
  }
  kbd {
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-subtle);
    background: var(--bg-dim);
    padding: 2px 7px;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .list {
    overflow-y: auto;
    padding: 6px;
    min-height: 0;
  }
  .empty {
    padding: 36px 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
  .empty em {
    font-style: italic;
    color: var(--text);
  }
  .hit {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: var(--r-sm);
    text-align: left;
    transition: background var(--dur-fast);
  }
  .hit.active {
    background: var(--accent-wash);
  }
  .hit-body {
    flex: 1;
    min-width: 0;
  }
  .hit-name {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.005em;
  }
  .hit-tag {
    font-size: var(--fs-xs);
    color: var(--text-muted);
    margin-top: 1px;
  }
  .hit-dots {
    display: flex;
    gap: 4px;
  }
  .hit-enter {
    display: inline-flex;
    align-items: center;
    color: var(--accent-ink);
  }
</style>
