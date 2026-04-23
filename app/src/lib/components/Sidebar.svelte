<script lang="ts">
	import Avatar from './Avatar.svelte';
	import ContactRow from './ContactRow.svelte';
	import IconBtn from './IconBtn.svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import BellIcon from '@lucide/svelte/icons/bell';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { Contact } from '$lib/data';

	type Props = {
		contacts: Contact[];
		activeId: string;
		onSelect: (id: string) => void;
		onSearch: () => void;
		onReminders: () => void;
	};
	let { contacts, activeId, onSelect, onSearch, onReminders }: Props = $props();

	let totalReminders = $derived(contacts.filter((c) => c.reminder).length);

	let groups = $derived.by(() => {
		const withUnread = contacts.filter((c) => c.unread > 0);
		const rest = contacts.filter((c) => c.unread === 0);
		return { withUnread, rest };
	});
</script>

<aside class="sidebar">
	<header class="head">
		<div class="brand">
			<span class="brand-name">People</span>
			<span class="brand-count">{contacts.length}</span>
		</div>
		<div class="head-actions">
			<IconBtn label="Reminders" onclick={onReminders} badge={totalReminders}>
				<BellIcon size={16} strokeWidth={2} />
			</IconBtn>
			<IconBtn label="Add person" onclick={() => {}}>
				<PlusIcon size={17} strokeWidth={2} />
			</IconBtn>
		</div>
	</header>

	<div class="search-wrap">
		<button type="button" class="search-btn" onclick={onSearch}>
			<SearchIcon size={14} strokeWidth={2} />
			<span>Search people, messages…</span>
			<kbd>⌘K</kbd>
		</button>
	</div>

	<div class="list">
		{#if groups.withUnread.length > 0}
			<div class="group-head">
				<span class="group-label">Waiting for you</span>
				<span class="group-count">{groups.withUnread.length}</span>
			</div>
			{#each groups.withUnread as contact (contact.id)}
				<ContactRow
					{contact}
					active={contact.id === activeId}
					onclick={() => onSelect(contact.id)}
				/>
			{/each}
		{/if}

		{#if groups.rest.length > 0}
			<div class="group-head">
				<span class="group-label">Recent</span>
				<span class="group-count">{groups.rest.length}</span>
			</div>
			{#each groups.rest as contact (contact.id)}
				<ContactRow
					{contact}
					active={contact.id === activeId}
					onclick={() => onSelect(contact.id)}
				/>
			{/each}
		{/if}
	</div>

	<footer class="foot">
		<Avatar initials="YO" color="var(--accent)" size={28} />
		<div class="me">
			<div class="me-name">You</div>
			<div class="me-sub">Personal account</div>
		</div>
		<IconBtn label="Settings" onclick={() => {}}>
			<SettingsIcon size={15} strokeWidth={2} />
		</IconBtn>
	</footer>
</aside>

<style>
	.sidebar {
		width: 272px;
		background: var(--surface-alt);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		height: 100%;
		position: relative;
		z-index: 1;
		box-shadow: inset -1px 0 0 var(--border);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 16px 12px 10px 16px;
	}
	.brand {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.brand-name {
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 400;
		color: var(--text-strong);
		letter-spacing: -0.01em;
	}
	.brand-count {
		font-size: 10.5px;
		font-weight: 600;
		color: var(--text-subtle);
		background: oklch(90% 0.022 62);
		padding: 2px 7px;
		border-radius: 99px;
		font-variant-numeric: tabular-nums;
	}
	.head-actions {
		display: flex;
		gap: 2px;
	}

	.search-wrap {
		padding: 2px 12px 12px;
	}
	.search-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px 7px 11px;
		border-radius: var(--r-sm);
		background: oklch(92% 0.02 62);
		color: var(--text-subtle);
		font-size: var(--fs-xs);
		transition: background var(--dur-fast);
	}
	.search-btn:hover {
		background: oklch(90% 0.024 62);
		color: var(--text-muted);
	}
	.search-btn span {
		flex: 1;
		text-align: left;
	}
	kbd {
		font-family: var(--font-body);
		font-size: 10px;
		font-weight: 600;
		color: var(--text-subtle);
		background: var(--surface);
		padding: 2px 6px;
		border-radius: 4px;
		box-shadow: 0 0 0 1px var(--border);
	}

	.list {
		flex: 1;
		overflow-y: auto;
		padding: 0 8px 12px;
	}

	.group-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 14px 10px 6px;
	}
	.group-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		color: var(--text-subtle);
	}
	.group-count {
		font-size: 10px;
		color: var(--text-subtle);
		font-variant-numeric: tabular-nums;
	}

	.foot {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-top: 1px solid var(--border);
		background: oklch(92% 0.024 62);
	}
	.me {
		flex: 1;
		min-width: 0;
	}
	.me-name {
		font-size: var(--fs-sm);
		font-weight: 600;
		color: var(--text);
		letter-spacing: -0.005em;
	}
	.me-sub {
		font-size: 10.5px;
		color: var(--text-muted);
		margin-top: 1px;
	}
</style>
