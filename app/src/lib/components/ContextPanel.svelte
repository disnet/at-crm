<script lang="ts">
	import Avatar from './Avatar.svelte';
	import ReminderChip from './ReminderChip.svelte';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import LinkIcon from '@lucide/svelte/icons/link';
	import { SOURCES, type Contact } from '$lib/data';

	type Props = {
		contact: Contact | null;
		onOpenProfile: () => void;
	};
	let { contact, onOpenProfile }: Props = $props();
</script>

<aside class="panel">
	{#if contact}
		<header class="head">
			<Avatar initials={contact.initials} color={contact.avatarColor} size={54} ring />
			<h2 class="name">{contact.name}</h2>
			<p class="tag">{contact.tagline}</p>
			<button type="button" class="view-full" onclick={onOpenProfile}>View full profile</button>
		</header>

		<section class="block">
			<h3 class="block-title">Details</h3>
			<ul class="details">
				{#if contact.location}
					<li>
						<span class="d-icon"><MapPinIcon size={13} strokeWidth={2} /></span>
						<span>{contact.location}</span>
					</li>
				{/if}
				{#if contact.birthday}
					<li>
						<span class="d-icon"><CakeIcon size={13} strokeWidth={2} /></span>
						<span>{contact.birthday}</span>
					</li>
				{/if}
				{#if contact.url}
					<li>
						<span class="d-icon"><LinkIcon size={13} strokeWidth={2} /></span>
						<span>{contact.url}</span>
					</li>
				{/if}
			</ul>
		</section>

		{#if contact.reminder}
			<section class="block">
				<h3 class="block-title">Reminder</h3>
				<ReminderChip reminder={contact.reminder} variant="embedded" />
			</section>
		{/if}

		<section class="block">
			<h3 class="block-title">Connected</h3>
			<ul class="sources">
				{#each contact.sources as src (src)}
					{@const cfg = SOURCES[src]}
					<li>
						<span class="src-dot" style:--c={cfg.color}></span>
						<span class="src-label">{cfg.label}</span>
						<span class="src-status">synced</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</aside>

<style>
	.panel {
		width: 280px;
		flex-shrink: 0;
		background: var(--surface);
		border-left: 1px solid var(--border-soft);
		overflow-y: auto;
		padding: 24px 20px 32px;
	}

	.head {
		text-align: center;
		padding-bottom: 18px;
		border-bottom: 1px solid var(--border-soft);
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.name {
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 400;
		color: var(--text-strong);
		letter-spacing: -0.015em;
		line-height: 1.15;
		margin-top: 10px;
	}
	.tag {
		font-size: var(--fs-xs);
		color: var(--text-muted);
		margin-top: 3px;
	}
	.view-full {
		margin-top: 12px;
		font-size: var(--fs-xs);
		color: var(--text-muted);
		padding: 6px 14px;
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--border);
		transition: all var(--dur-fast);
	}
	.view-full:hover {
		color: var(--text-strong);
		background: var(--bg-dim);
		box-shadow: inset 0 0 0 1px var(--hairline);
	}

	.block {
		padding-top: 16px;
		margin-top: 16px;
		border-top: 1px solid var(--border-soft);
	}
	.block:first-of-type {
		border-top: none;
		margin-top: 0;
	}
	.block-title {
		font-size: 10px;
		font-weight: 700;
		color: var(--text-subtle);
		letter-spacing: 0.11em;
		text-transform: uppercase;
		margin-bottom: 10px;
	}

	.details {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.details li {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: var(--fs-sm);
		color: var(--text);
	}
	.d-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--bg-dim);
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.sources {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.sources li {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: var(--fs-sm);
		color: var(--text);
	}
	.src-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c);
		flex-shrink: 0;
	}
	.src-label {
		flex: 1;
		font-weight: 500;
	}
	.src-status {
		font-size: 10px;
		color: var(--text-subtle);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
</style>
