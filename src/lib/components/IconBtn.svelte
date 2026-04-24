<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    label: string;
    onclick?: () => void;
    active?: boolean;
    badge?: number;
    children: Snippet;
  };
  let { label, onclick, active = false, badge = 0, children }: Props = $props();
</script>

<button type="button" class="icon-btn" class:active aria-label={label} title={label} {onclick}>
  {@render children()}
  {#if badge > 0}
    <span class="badge" aria-hidden="true"></span>
  {/if}
</button>

<style>
  .icon-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--r-sm);
    color: var(--text-muted);
    transition:
      background var(--dur-fast),
      color var(--dur-fast);
  }
  .icon-btn:hover {
    background: var(--surface-inset);
    color: var(--text);
  }
  .icon-btn.active {
    background: var(--accent-tint);
    color: var(--accent-ink);
  }
  .badge {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--surface-alt);
  }
</style>
