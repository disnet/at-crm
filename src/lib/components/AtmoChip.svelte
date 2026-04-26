<script lang="ts">
  import { ATMO_SOURCES, type AtmoSource } from '$lib/data';

  type Props = { source: AtmoSource; size?: 'sm' | 'md' };
  let { source, size = 'sm' }: Props = $props();

  let cfg = $derived(ATMO_SOURCES[source]);
</script>

<span
  class="chip"
  class:sm={size === 'sm'}
  style:--c={cfg.color}
  style:--bg={cfg.bg}
  title="Mutual on {cfg.label}"
>
  <span class="tick"></span>
  <span class="label">Mutual · {cfg.label}</span>
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px 3px 8px;
    border-radius: var(--r-pill);
    background: var(--bg);
    color: var(--c);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .chip.sm {
    font-size: 9.5px;
    padding: 2px 7px 2px 6px;
  }
  .tick {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--c);
    flex-shrink: 0;
  }
  .label {
    line-height: 1;
  }
</style>
