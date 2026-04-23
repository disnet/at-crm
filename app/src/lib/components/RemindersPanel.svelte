<script lang="ts">
	import Overlay from './Overlay.svelte';
	import Avatar from './Avatar.svelte';
	import ReminderChip from './ReminderChip.svelte';
	import BellIcon from '@lucide/svelte/icons/bell';
	import XIcon from '@lucide/svelte/icons/x';
	import type { Contact } from '$lib/data';

	type Props = {
		contacts: Contact[];
		onClose: () => void;
		onSelect: (id: string) => void;
	};
	let { contacts, onClose, onSelect }: Props = $props();

	let withReminders = $derived(contacts.filter((c) => c.reminder));
</script>

<Overlay {onClose} width={440}>
	<div class="head">
		<div class="head-title">
			<span class="head-icon"><BellIcon size={14} strokeWidth={2} /></span>
			<h2>Reminders</h2>
			<span class="head-count">{withReminders.length}</span>
		</div>
		<button type="button" class="close" aria-label="Close" onclick={onClose}>
			<XIcon size={14} strokeWidth={2} />
		</button>
	</div>
	<div class="body">
		{#if withReminders.length === 0}
			<div class="empty">
				<p>No reminders yet. Log an interaction with someone and add a nudge for future-you.</p>
			</div>
		{:else}
			<ul class="list">
				{#each withReminders as c (c.id)}
					<li class="item">
						<button
							type="button"
							class="who"
							onclick={() => {
								onSelect(c.id);
								onClose();
							}}
						>
							<Avatar
								initials={c.initials}
								color={c.avatarColor}
								size={28}
								imageUrl={c.avatarUrl}
							/>
							<span class="who-name">{c.name}</span>
						</button>
						{#if c.reminder}
							<ReminderChip reminder={c.reminder} variant="embedded" />
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</Overlay>

<style>
	.head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 16px 18px 14px;
		border-bottom: 1px solid var(--border-soft);
	}
	.head-title {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.head-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--amber-tint);
		color: var(--amber-deep);
	}
	h2 {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 400;
		color: var(--text-strong);
		letter-spacing: -0.01em;
	}
	.head-count {
		font-size: 10.5px;
		font-weight: 600;
		color: var(--text-subtle);
		background: var(--bg-dim);
		padding: 2px 7px;
		border-radius: 99px;
	}
	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 6px;
		color: var(--text-subtle);
		transition: all var(--dur-fast);
	}
	.close:hover {
		background: var(--bg-dim);
		color: var(--text-strong);
	}
	.body {
		padding: 14px 18px 20px;
		overflow-y: auto;
	}
	.empty {
		padding: 24px 8px;
		font-size: var(--fs-sm);
		color: var(--text-muted);
		text-align: center;
		line-height: 1.7;
	}
	.list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.item {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.who {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		align-self: flex-start;
		padding: 3px 10px 3px 4px;
		border-radius: 99px;
		background: var(--bg-dim);
		transition: background var(--dur-fast);
	}
	.who:hover {
		background: var(--accent-wash);
	}
	.who-name {
		font-size: var(--fs-sm);
		font-weight: 600;
		color: var(--text-strong);
		letter-spacing: -0.005em;
	}
</style>
