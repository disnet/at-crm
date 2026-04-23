<script lang="ts">
	import SourceChip from './SourceChip.svelte';
	import type { Message, SourceKey } from '$lib/data';

	type Props = {
		msg: Message;
		source: SourceKey;
		showSource?: boolean;
	};
	let { msg, source, showSource = false }: Props = $props();

	let isOut = $derived(msg.dir === 'out');
</script>

<div class="row" class:out={isOut}>
	{#if showSource && !isOut}
		<div class="source-lead">
			<SourceChip {source} />
		</div>
	{/if}
	<div class="bubble" class:out={isOut}>
		{#if msg.subject && !isOut}
			<div class="subject label">{msg.subject}</div>
		{/if}
		<div class="text">{msg.text}</div>
	</div>
	<div class="ts">{msg.ts}</div>
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		margin-bottom: 10px;
		max-width: min(620px, 78%);
	}
	.row.out {
		align-items: flex-end;
		align-self: flex-end;
	}
	.source-lead {
		margin-bottom: 4px;
		margin-left: 2px;
	}
	.bubble {
		padding: 10px 14px;
		border-radius: 4px 16px 16px 16px;
		background: var(--surface);
		color: var(--text);
		font-size: var(--fs-base);
		line-height: 1.55;
		box-shadow: var(--elev-1);
		word-wrap: break-word;
	}
	.bubble.out {
		border-radius: 16px 4px 16px 16px;
		background: var(--accent);
		color: oklch(99% 0.003 60);
		box-shadow: 0 1px 2px oklch(50% 0.12 38 / 0.22);
	}
	.subject {
		margin-bottom: 5px;
		color: var(--text-subtle);
	}
	.text {
		white-space: pre-wrap;
	}
	.ts {
		margin-top: 4px;
		font-size: var(--fs-2xs);
		color: var(--text-subtle);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.01em;
		padding: 0 6px;
	}
</style>
