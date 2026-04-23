<script lang="ts">
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import BellIcon from '@lucide/svelte/icons/bell';
	import HandshakeIcon from '@lucide/svelte/icons/handshake';
	import type { NoteEntry } from '$lib/data';

	type Props = { entry: NoteEntry };
	let { entry }: Props = $props();

	const labels = {
		note: 'Note',
		call: 'Call',
		meeting: 'Meeting',
		reminder: 'Reminder'
	};
</script>

<div class="entry">
	<span class="icon" data-type={entry.type} aria-hidden="true">
		{#if entry.type === 'call'}
			<PhoneIcon size={14} strokeWidth={2} />
		{:else if entry.type === 'reminder'}
			<BellIcon size={14} strokeWidth={2} />
		{:else if entry.type === 'meeting'}
			<HandshakeIcon size={14} strokeWidth={2} />
		{:else}
			<StickyNoteIcon size={14} strokeWidth={2} />
		{/if}
	</span>
	<div class="body">
		<div class="kind label">{labels[entry.type] ?? 'Note'}</div>
		<p class="text">{entry.text}</p>
		<div class="ts">{entry.ts}</div>
	</div>
</div>

<style>
	.entry {
		display: flex;
		gap: 12px;
		padding: 14px 4px;
		border-bottom: 1px solid var(--border-soft);
	}
	.entry:last-child {
		border-bottom: none;
	}
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--surface-inset);
		color: var(--text-muted);
		flex-shrink: 0;
		margin-top: 1px;
	}
	.icon[data-type='call']     { background: var(--src-signal-bg);   color: var(--src-signal); }
	.icon[data-type='meeting']  { background: var(--accent-wash);     color: var(--accent-ink); }
	.icon[data-type='reminder'] { background: var(--amber-tint);      color: var(--amber-deep); }
	.icon[data-type='note']     { background: var(--src-notes-bg);    color: var(--src-notes); }

	.body {
		flex: 1;
		min-width: 0;
	}
	.kind {
		margin-bottom: 4px;
		font-size: 10px;
	}
	.text {
		font-size: var(--fs-sm);
		line-height: 1.55;
		color: var(--text);
	}
	.ts {
		margin-top: 6px;
		font-size: var(--fs-2xs);
		color: var(--text-subtle);
		font-variant-numeric: tabular-nums;
	}
</style>
