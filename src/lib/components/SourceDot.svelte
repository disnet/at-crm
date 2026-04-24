<script lang="ts">
  import { SOURCES, type SourceKey } from '$lib/data';

  type Props = { source: SourceKey; size?: number };
  let { source, size = 7 }: Props = $props();

  let cfg = $derived(SOURCES[source]);
</script>

<span class="dot" style:--c={cfg.color} style:--s="{size}px" title={cfg.label}></span>

<style>
  .dot {
    display: inline-block;
    width: var(--s);
    height: var(--s);
    border-radius: 50%;
    background: var(--c);
    flex-shrink: 0;
  }
</style>
