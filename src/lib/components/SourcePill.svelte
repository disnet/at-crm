<script lang="ts">
  import { SOURCES, type SourceKey } from '$lib/data';

  type Props = {
    source: SourceKey;
    active?: boolean;
    onclick?: () => void;
  };
  let { source, active = false, onclick }: Props = $props();

  let cfg = $derived(SOURCES[source]);
</script>

<button type="button" class="pill" class:active style:--c={cfg.color} style:--bg={cfg.bg} {onclick}>
  <span class="dot"></span>
  <span class="label">{cfg.label}</span>
</button>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 11px 4px 10px;
    border-radius: var(--r-pill);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--fs-xs);
    font-weight: 500;
    transition:
      background var(--dur-fast) var(--ease-out-quart),
      color var(--dur-fast);
    line-height: 1;
  }
  .pill:hover {
    background: var(--bg);
    color: var(--c);
  }
  .pill.active {
    background: var(--c);
    color: oklch(99% 0 0);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--c);
    flex-shrink: 0;
    transition: background var(--dur-fast);
  }
  .pill.active .dot {
    background: oklch(99% 0 0 / 0.85);
  }
</style>
