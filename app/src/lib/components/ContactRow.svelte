<script lang="ts">
	import Avatar from './Avatar.svelte';
	import SourceDot from './SourceDot.svelte';
	import BellIcon from '@lucide/svelte/icons/bell';
	import type { Contact } from '$lib/data';

	type Props = {
		contact: Contact;
		active: boolean;
		onclick: () => void;
	};
	let { contact, active, onclick }: Props = $props();
</script>

<button type="button" class="row" class:active {onclick}>
	<div class="avatar-wrap">
		<Avatar initials={contact.initials} color={contact.avatarColor} size={40} />
		{#if contact.unread > 0}
			<span class="unread" aria-label="{contact.unread} unread">{contact.unread}</span>
		{/if}
	</div>
	<div class="body">
		<div class="line-1">
			<span class="name" class:bold={contact.unread > 0}>{contact.name}</span>
			<span class="when">{contact.lastActive}</span>
		</div>
		<div class="preview">{contact.lastMsg}</div>
		<div class="meta">
			{#each contact.sources as src (src)}
				<SourceDot source={src} />
			{/each}
			{#if contact.reminder}
				<span class="reminder-mark" aria-label="Has reminder">
					<BellIcon size={10} strokeWidth={2.2} />
				</span>
			{/if}
		</div>
	</div>
</button>

<style>
	.row {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 11px;
		padding: 9px 10px;
		border-radius: var(--r-md);
		text-align: left;
		transition: background var(--dur-fast) var(--ease-out-quart);
		margin-bottom: 1px;
	}
	.row:hover {
		background: oklch(92% 0.026 64);
	}
	.row.active {
		background: var(--surface);
		box-shadow: var(--elev-1);
	}
	.avatar-wrap {
		position: relative;
		flex-shrink: 0;
	}
	.unread {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 17px;
		height: 17px;
		padding: 0 5px;
		border-radius: 999px;
		background: var(--accent);
		color: oklch(99% 0 0);
		font-size: 10px;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 0 2px var(--surface-alt);
		letter-spacing: 0;
	}
	.row.active .unread {
		box-shadow: 0 0 0 2px var(--surface);
	}
	.body {
		flex: 1;
		min-width: 0;
	}
	.line-1 {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 6px;
	}
	.name {
		font-size: var(--fs-sm);
		font-weight: 500;
		color: var(--text);
		letter-spacing: -0.005em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.name.bold {
		font-weight: 700;
		color: var(--text-strong);
	}
	.when {
		font-size: 10.5px;
		color: var(--text-subtle);
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
	}
	.preview {
		font-size: var(--fs-xs);
		color: var(--text-muted);
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 5px;
		margin-top: 6px;
	}
	.reminder-mark {
		display: inline-flex;
		align-items: center;
		color: var(--amber-deep);
		margin-left: 1px;
	}
</style>
