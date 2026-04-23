<script lang="ts">
  import Overlay from './Overlay.svelte';
  import Avatar from './Avatar.svelte';
  import AtSignIcon from '@lucide/svelte/icons/at-sign';
  import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
  import LoaderIcon from '@lucide/svelte/icons/loader-circle';
  import { searchActorsTypeahead, type ActorTypeahead } from '$lib/atproto';
  import { addContactFromBluesky } from '$lib/db';

  type Props = {
    onClose: () => void;
    onAdded: (id: string) => void;
  };
  let { onClose, onAdded }: Props = $props();

  let query = $state('');
  let inputEl = $state<HTMLInputElement | null>(null);
  let actors = $state<ActorTypeahead[]>([]);
  let selected = $state(0);
  let searching = $state(false);
  let adding = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    inputEl?.focus();
  });

  let cleanQuery = $derived(query.trim().replace(/^@/, ''));

  $effect(() => {
    const q = cleanQuery;
    if (!q) {
      actors = [];
      searching = false;
      return;
    }
    const ctrl = new AbortController();
    searching = true;
    const t = setTimeout(async () => {
      try {
        const res = await searchActorsTypeahead(q, ctrl.signal);
        actors = res;
        selected = 0;
        error = null;
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          actors = [];
          error = 'Could not reach Bluesky.';
        }
      } finally {
        searching = false;
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  });

  async function pick(actor: ActorTypeahead) {
    if (adding) return;
    adding = true;
    error = null;
    try {
      const contact = await addContactFromBluesky(actor);
      onAdded(contact.id);
      onClose();
    } catch (err) {
      error = (err as Error).message ?? 'Failed to add contact.';
    } finally {
      adding = false;
    }
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (actors.length) selected = Math.min(selected + 1, actors.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (actors.length) selected = Math.max(selected - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const a = actors[selected];
      if (a) pick(a);
    }
  }
</script>

<Overlay {onClose} width={520}>
  <div class="add">
    <header class="head">
      <span class="head-icon"><AtSignIcon size={13} strokeWidth={2.2} /></span>
      <span class="head-label">Add a person</span>
      <span class="head-hint">Bluesky handle or DID</span>
    </header>

    <div class="search-row">
      <span class="at">@</span>
      <input
        bind:this={inputEl}
        bind:value={query}
        placeholder="alice.bsky.social"
        autocomplete="off"
        spellcheck="false"
        onkeydown={onKey}
        disabled={adding}
      />
      {#if searching}
        <span class="spin"><LoaderIcon size={14} strokeWidth={2} /></span>
      {/if}
    </div>

    <div class="results" role="listbox">
      {#if !cleanQuery}
        <div class="hint">
          <p>Look someone up by their Bluesky handle.</p>
          <p class="hint-sub">
            We'll pull their AT Protocol identity and any sifa.id professional profile from their
            PDS.
          </p>
        </div>
      {:else if error}
        <div class="hint error-hint"><p>{error}</p></div>
      {:else if actors.length === 0 && !searching}
        <div class="hint"><p>No one matches <em>"{cleanQuery}"</em>.</p></div>
      {:else}
        {#each actors as actor, i (actor.did)}
          <button
            type="button"
            class="hit"
            class:active={i === selected}
            onclick={() => pick(actor)}
            onmouseenter={() => (selected = i)}
            disabled={adding}
          >
            {#if actor.avatar}
              <img class="avatar-img" src={actor.avatar} alt="" loading="lazy" />
            {:else}
              <Avatar
                initials={(actor.displayName || actor.handle).slice(0, 2).toUpperCase()}
                color="oklch(68% 0.13 {(actor.did.charCodeAt(actor.did.length - 1) * 7) % 360})"
                size={34}
              />
            {/if}
            <div class="hit-body">
              <div class="hit-name">{actor.displayName || actor.handle}</div>
              <div class="hit-handle">@{actor.handle}</div>
            </div>
            {#if i === selected}
              <span class="hit-enter">
                {#if adding}
                  <LoaderIcon size={12} strokeWidth={2} />
                {:else}
                  <CornerDownLeftIcon size={12} strokeWidth={2} />
                {/if}
              </span>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  </div>
</Overlay>

<style>
  .add {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 18px 10px;
  }
  .head-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent-wash);
    color: var(--accent);
  }
  .head-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .head-hint {
    margin-left: auto;
    font-size: 10.5px;
    color: var(--text-subtle);
  }

  .search-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px 12px;
    border-bottom: 1px solid var(--border-soft);
  }
  .at {
    font-family: var(--font-display);
    font-size: var(--fs-md);
    color: var(--text-subtle);
  }
  .search-row input {
    flex: 1;
    font-size: var(--fs-md);
    color: var(--text);
    background: none;
    border: 0;
  }
  .search-row input::placeholder {
    color: var(--text-subtle);
  }
  .spin {
    display: inline-flex;
    color: var(--text-subtle);
    animation: spin 0.9s linear infinite;
  }

  .results {
    overflow-y: auto;
    padding: 6px;
    min-height: 80px;
    max-height: 360px;
  }

  .hint {
    padding: 22px 20px 26px;
    text-align: center;
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
  .hint p + p.hint-sub {
    margin-top: 6px;
    font-size: var(--fs-xs);
    color: var(--text-subtle);
    max-width: 32ch;
    margin-inline: auto;
  }
  .hint em {
    font-style: italic;
    color: var(--text);
  }
  .error-hint {
    color: var(--accent-ink);
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
  .hit:disabled {
    opacity: 0.6;
    cursor: progress;
  }
  .avatar-img {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow:
      inset 0 0 0 1px oklch(100% 0 0 / 0.1),
      var(--elev-1);
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hit-handle {
    font-size: var(--fs-xs);
    color: var(--text-muted);
    margin-top: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hit-enter {
    display: inline-flex;
    align-items: center;
    color: var(--accent-ink);
  }
  .hit-enter :global(svg) {
    animation: none;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
