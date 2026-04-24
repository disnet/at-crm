<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import ConstructionIcon from '@lucide/svelte/icons/construction';
  import LoaderIcon from '@lucide/svelte/icons/loader-circle';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import HammerIcon from '@lucide/svelte/icons/hammer';
  import CoffeeIcon from '@lucide/svelte/icons/coffee';
  import SproutIcon from '@lucide/svelte/icons/sprout';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import Avatar from '$lib/components/Avatar.svelte';
  import { getProfile, searchActorsTypeahead, type ActorTypeahead } from '$lib/atproto';
  import { setUser } from '$lib/auth';
  import { getOAuthClient, isRecoverableOAuthClientError } from '$lib/oauth';

  function hasCallbackParams(): boolean {
    if (typeof window === 'undefined') return false;
    const p = new URLSearchParams(window.location.search);
    return p.has('code') || p.has('state') || p.has('iss') || p.has('error');
  }

  let query = $state('');
  let submitting = $state(false);
  let returning = $state(hasCallbackParams());
  let resolving = $state(true);
  let error = $state<string | null>(null);
  let inputEl = $state<HTMLInputElement | null>(null);
  let actors = $state<ActorTypeahead[]>([]);
  let selected = $state(0);
  let searching = $state(false);

  let cleanQuery = $derived(query.trim().replace(/^@/, ''));

  onMount(async () => {
    try {
      const result = await initOAuth();
      if (result?.session) {
        await persistSession(result.session.sub);
        await goto('/');
        return;
      }
    } catch (err) {
      console.error('OAuth init failed', err);
      error = oauthError(err);
    } finally {
      resolving = false;
      returning = false;
    }
    inputEl?.focus();
  });

  async function persistSession(did: string) {
    const profile = await getProfile(did).catch(() => null);
    setUser({
      did,
      handle: profile?.handle ?? did,
      displayName: profile?.displayName,
      avatar: profile?.avatar
    });
  }

  async function signIn(e: Event) {
    e.preventDefault();
    await startSignIn(cleanQuery);
  }

  async function startSignIn(handle: string) {
    if (!handle || submitting) return;
    submitting = true;
    error = null;
    try {
      const client = await getOAuthClient();
      try {
        await client.signInRedirect(handle);
      } catch (err) {
        if (!isRecoverableOAuthClientError(err)) throw err;
        const freshClient = await getOAuthClient({ forceFresh: true });
        await freshClient.signInRedirect(handle);
      }
      // signInRedirect navigates away; this line is unreachable on success.
    } catch (err) {
      console.error('OAuth signIn failed', err);
      error = oauthError(err);
      submitting = false;
    }
  }

  async function initOAuth() {
    const client = await getOAuthClient();
    try {
      return await client.init();
    } catch (err) {
      if (!isRecoverableOAuthClientError(err)) throw err;
      const freshClient = await getOAuthClient({ forceFresh: true });
      return await freshClient.init();
    }
  }

  async function chooseActor(actor: ActorTypeahead) {
    query = actor.handle;
    actors = [];
    await startSignIn(actor.handle);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      if (!actors.length) return;
      e.preventDefault();
      selected = Math.min(selected + 1, actors.length - 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      if (!actors.length) return;
      e.preventDefault();
      selected = Math.max(selected - 1, 0);
      return;
    }
    if (e.key === 'Escape') {
      actors = [];
      return;
    }
    if (e.key === 'Enter') {
      const actor = actors[selected];
      if (!actor) return;
      e.preventDefault();
      void chooseActor(actor);
    }
  }

  $effect(() => {
    const q = cleanQuery;
    if (!q || submitting || resolving) {
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
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          actors = [];
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

  function oauthError(err: unknown): string {
    const msg = (err as { message?: string })?.message ?? '';
    if (/handle|resolve|did/i.test(msg)) return "Couldn't find that handle. Try again?";
    if (/network|fetch|abort/i.test(msg)) return "The network blinked. Try again?";
    return msg || 'Something went sideways. Try again?';
  }
</script>

<svelte:head>
  <title>Sign in — People</title>
</svelte:head>

<main class="page">
  {#if returning}
    <div class="returning" role="status">
      <span class="spin"><LoaderIcon size={18} strokeWidth={2.2} /></span>
      <span class="returning-label">welcoming you back…</span>
    </div>
  {:else}
  <div class="cones" aria-hidden="true">
    <span class="cone cone-1"><TriangleAlertIcon size={72} strokeWidth={1.6} /></span>
    <span class="cone cone-2"><TriangleAlertIcon size={96} strokeWidth={1.4} /></span>
    <span class="cone cone-3"><TriangleAlertIcon size={48} strokeWidth={1.8} /></span>
  </div>

  <article class="card">
    <div class="sticker" aria-hidden="true">
      <span class="sticker-inner">
        <ConstructionIcon size={11} strokeWidth={2.4} />
        <span>pre-alpha · wet paint</span>
      </span>
    </div>

    <header class="head">
      <span class="kicker label">Personal CRM · v0.0.1</span>
      <h1 class="display title">Under construction.<br /><em>But do come in.</em></h1>
      <p class="lede">
        A quiet workshop for the people you care about. Half the floorboards are still down, but the
        coffee's already on.
      </p>
    </header>

    {#if resolving}
      <div class="resolving">
        <span class="spin"><LoaderIcon size={16} strokeWidth={2.2} /></span>
        <span>checking for your badge…</span>
      </div>
    {:else}
      <form class="form" onsubmit={signIn}>
        <label class="label field-label" for="handle">Sign in with your Atmosphere Account</label>
        <div class="field-wrap">
          <div class="field" class:has-error={!!error} class:is-busy={submitting}>
            <span class="at">@</span>
            <input
              id="handle"
              name="username"
              bind:this={inputEl}
              bind:value={query}
              placeholder="alice.bsky.social"
              autocomplete="username"
              autocapitalize="off"
              spellcheck="false"
              onkeydown={onKey}
              disabled={submitting}
            />
            {#if searching}
              <span class="field-spin spin"><LoaderIcon size={14} strokeWidth={2.2} /></span>
            {/if}
            <button type="submit" class="go" disabled={submitting || !query.trim()}>
              {#if submitting}
                <span class="spin"><LoaderIcon size={14} strokeWidth={2.2} /></span>
              {:else}
                <span class="go-label">Step inside</span>
                <ArrowRightIcon size={14} strokeWidth={2.2} />
              {/if}
            </button>
          </div>
          {#if actors.length > 0}
            <div class="suggestions" role="listbox" aria-label="Bluesky account suggestions">
              {#each actors as actor, i (actor.did)}
                <button
                  type="button"
                  class="suggestion"
                  class:active={i === selected}
                  onclick={() => chooseActor(actor)}
                  onmouseenter={() => (selected = i)}
                  disabled={submitting}
                >
                  {#if actor.avatar}
                    <img class="suggestion-avatar" src={actor.avatar} alt="" loading="lazy" />
                  {:else}
                    <Avatar
                      initials={(actor.displayName || actor.handle).slice(0, 2).toUpperCase()}
                      color="oklch(68% 0.13 {(actor.did.charCodeAt(actor.did.length - 1) * 7) % 360})"
                      size={32}
                    />
                  {/if}
                  <span class="suggestion-body">
                    <span class="suggestion-name">{actor.displayName || actor.handle}</span>
                    <span class="suggestion-handle">@{actor.handle}</span>
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        {#if error}
          <p class="error">{error}</p>
        {/if}
        <p class="pinky">
          We'll send you to your PDS to sign in, then bring you back.
          <span class="pinky-small">(your password never touches this workshop.)</span>
        </p>
      </form>
    {/if}

    <footer class="foot">
      <dl class="status">
        <div class="status-row">
          <dt><SproutIcon size={12} strokeWidth={2.2} /> Works</dt>
          <dd>atproto OAuth · browsing people · threads</dd>
        </div>
        <div class="status-row">
          <dt><HammerIcon size={12} strokeWidth={2.2} /> Building</dt>
          <dd>reminders · sync across devices</dd>
        </div>
        <div class="status-row">
          <dt><CoffeeIcon size={12} strokeWidth={2.2} /> Brewing</dt>
          <dd>everything else — give it a minute</dd>
        </div>
      </dl>
    </footer>
  </article>

  <p class="tag">a tiny prototype · handmade with serifs and terracotta</p>
  {/if}
</main>

<style>
  .page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px 64px;
    position: relative;
    z-index: 1;
    overflow: hidden;
    background:
      radial-gradient(
        1200px 600px at 50% -10%,
        var(--accent-wash) 0%,
        transparent 60%
      ),
      var(--bg);
  }

  .cones {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }
  .cone {
    position: absolute;
    display: inline-flex;
    color: var(--accent);
    opacity: 0.13;
    line-height: 1;
    animation: bob var(--bob-dur) var(--ease-out-quart) infinite alternate;
  }
  .cone-1 {
    top: 12%;
    left: 10%;
    transform: rotate(-8deg);
    --bob-dur: 4.2s;
  }
  .cone-2 {
    bottom: 14%;
    right: 9%;
    transform: rotate(6deg);
    --bob-dur: 5.1s;
    opacity: 0.09;
  }
  .cone-3 {
    top: 65%;
    left: 14%;
    transform: rotate(10deg);
    --bob-dur: 3.6s;
    opacity: 0.15;
    color: var(--amber-deep);
  }
  @keyframes bob {
    from {
      translate: 0 0;
    }
    to {
      translate: 0 -6px;
    }
  }

  .card {
    position: relative;
    width: 100%;
    max-width: 520px;
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-xl);
    box-shadow: var(--elev-4);
    padding: 44px 40px 28px;
    z-index: 1;
  }
  .card::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: calc(var(--r-xl) - 4px);
    box-shadow: inset 0 0 0 1px oklch(100% 0 0 / 0.5);
    pointer-events: none;
  }

  .sticker {
    position: absolute;
    top: -14px;
    right: 22px;
    transform: rotate(4deg);
    z-index: 2;
    pointer-events: none;
  }
  .sticker-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: var(--amber);
    color: oklch(20% 0.05 60);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border-radius: var(--r-xs);
    box-shadow:
      0 2px 0 var(--amber-deep),
      var(--elev-2);
  }

  .head {
    margin-bottom: 26px;
  }
  .kicker {
    display: block;
    color: var(--accent-ink);
    margin-bottom: 14px;
  }
  .title {
    font-size: clamp(28px, 4vw, var(--fs-2xl));
    color: var(--text-strong);
    margin-bottom: 14px;
  }
  .title em {
    font-style: italic;
    color: var(--accent);
  }
  .lede {
    font-size: var(--fs-md);
    line-height: 1.55;
    color: var(--text-muted);
    max-width: 42ch;
  }

  .form {
    margin-bottom: 28px;
  }
  .field-wrap {
    position: relative;
  }

  .resolving {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 0 26px;
    color: var(--text-muted);
    font-size: var(--fs-sm);
    font-style: italic;
  }

  .returning {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: var(--text-muted);
    font-size: var(--fs-sm);
    font-style: italic;
    opacity: 0;
    animation: fade-in var(--dur-slow) var(--ease-out-quart) 300ms forwards;
  }
  .returning-label {
    letter-spacing: 0.01em;
  }
  @keyframes fade-in {
    to {
      opacity: 1;
    }
  }
  .field-label {
    display: block;
    margin-bottom: 8px;
    color: var(--text-muted);
  }
  .field {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 6px 6px 14px;
    background: var(--bg-dim);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    transition:
      border-color var(--dur-fast),
      background var(--dur-fast),
      box-shadow var(--dur-fast);
  }
  .field:focus-within {
    border-color: var(--accent);
    background: var(--surface);
    box-shadow: 0 0 0 4px var(--accent-wash);
  }
  .field.has-error {
    border-color: var(--src-email);
    box-shadow: 0 0 0 4px var(--src-email-bg);
  }
  .field.is-busy {
    opacity: 0.7;
  }
  .at {
    font-family: var(--font-display);
    font-size: var(--fs-md);
    color: var(--text-subtle);
  }
  .field input {
    flex: 1;
    min-width: 0;
    padding: 10px 0;
    font-size: var(--fs-md);
    color: var(--text);
  }
  .field input:focus-visible {
    outline: none;
  }
  .field input::placeholder {
    color: var(--text-subtle);
  }
  .field-spin {
    color: var(--text-subtle);
  }
  .suggestions {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    right: 0;
    z-index: 6;
    padding: 6px;
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-md);
    box-shadow: var(--elev-3);
    max-height: min(320px, 45dvh);
    overflow: auto;
  }
  .suggestion {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: var(--r-sm);
    text-align: left;
    transition: background var(--dur-fast);
  }
  .suggestion:hover,
  .suggestion.active {
    background: var(--bg-dim);
  }
  .suggestion-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    background: var(--bg-dim);
  }
  .suggestion-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .suggestion-name {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .suggestion-handle {
    font-size: var(--fs-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .go {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    background: var(--accent);
    color: oklch(99% 0.01 60);
    font-size: var(--fs-sm);
    font-weight: 600;
    letter-spacing: 0.005em;
    border-radius: var(--r-sm);
    transition:
      background var(--dur-fast),
      transform var(--dur-fast);
  }
  .go:hover:not(:disabled) {
    background: var(--accent-deep);
  }
  .go:active:not(:disabled) {
    transform: translateY(1px);
  }
  .go:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .error {
    margin-top: 10px;
    font-size: var(--fs-xs);
    color: var(--src-email);
  }
  .pinky {
    margin-top: 14px;
    font-size: var(--fs-xs);
    color: var(--text-muted);
    line-height: 1.55;
  }
  .pinky-small {
    display: block;
    color: var(--text-subtle);
    font-style: italic;
    margin-top: 2px;
  }

  .foot {
    padding-top: 20px;
    border-top: 1px dashed var(--border);
  }
  .status {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .status-row {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 12px;
    align-items: baseline;
    font-size: var(--fs-xs);
  }
  .status-row dt {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    font-size: 10px;
  }
  .status-row dd {
    color: var(--text);
  }

  .tag {
    margin-top: 28px;
    font-size: var(--fs-xs);
    color: var(--text-subtle);
    font-style: italic;
    text-align: center;
    z-index: 1;
  }

  @media (max-width: 520px) {
    .card {
      padding: 38px 24px 22px;
    }
    .sticker {
      right: 14px;
    }
    .status-row {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }
</style>
