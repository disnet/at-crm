<script lang="ts">
	import Avatar from './Avatar.svelte';
	import SourceChip from './SourceChip.svelte';
	import ReminderChip from './ReminderChip.svelte';
	import NoteEntryCard from './NoteEntry.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import LinkIcon from '@lucide/svelte/icons/link';
	import { isNote, type Contact, type NoteEntry } from '$lib/data';

	type Props = {
		contact: Contact;
		onBack: () => void;
	};
	let { contact, onBack }: Props = $props();

	let notes = $derived.by(() => {
		const all: NoteEntry[] = [];
		for (const entries of Object.values(contact.threads)) {
			if (!entries) continue;
			for (const e of entries) if (isNote(e)) all.push(e);
		}
		return all;
	});

	const details = $derived.by(() => {
		const items: { icon: typeof MapPinIcon; label: string; value: string }[] = [];
		if (contact.location) items.push({ icon: MapPinIcon, label: 'Location', value: contact.location });
		if (contact.birthday) items.push({ icon: CakeIcon, label: 'Birthday', value: contact.birthday });
		if (contact.url) items.push({ icon: LinkIcon, label: 'Link', value: contact.url });
		return items;
	});
</script>

<main class="profile">
	<div class="wrap">
		<button type="button" class="back" onclick={onBack}>
			<ArrowLeftIcon size={14} strokeWidth={2} />
			<span>Back to thread</span>
		</button>

		<header class="hero">
			<Avatar initials={contact.initials} color={contact.avatarColor} size={78} ring />
			<div>
				<h1 class="hero-name">{contact.name}</h1>
				<p class="hero-tag">{contact.tagline}</p>
				<div class="hero-chips">
					{#each contact.sources as src (src)}
						<SourceChip source={src} size="md" />
					{/each}
				</div>
			</div>
		</header>

		{#if details.length > 0}
			<section class="details-grid">
				{#each details as item (item.label)}
					<div class="detail">
						<div class="detail-head">
							<span class="detail-icon"><item.icon size={12} strokeWidth={2} /></span>
							<span class="detail-label">{item.label}</span>
						</div>
						<div class="detail-val">{item.value}</div>
					</div>
				{/each}
			</section>
		{/if}

		{#if contact.reminder}
			<section class="section">
				<h2 class="section-title">Upcoming</h2>
				<ReminderChip reminder={contact.reminder} />
			</section>
		{/if}

		<section class="section">
			<h2 class="section-title">Notes &amp; logs</h2>
			{#if notes.length === 0}
				<p class="empty">No notes yet. Log a call, meeting, or thought after your next chat.</p>
			{:else}
				<div class="notes">
					{#each notes as note (note.id)}
						<NoteEntryCard entry={note} />
					{/each}
				</div>
			{/if}
		</section>
	</div>
</main>

<style>
	.profile {
		flex: 1;
		overflow-y: auto;
		background: var(--bg);
	}
	.wrap {
		max-width: 640px;
		margin: 0 auto;
		padding: 28px 28px 72px;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--text-muted);
		font-size: var(--fs-sm);
		padding: 4px 0;
		margin-bottom: 24px;
		transition: color var(--dur-fast);
	}
	.back:hover {
		color: var(--text-strong);
	}

	.hero {
		display: flex;
		gap: 20px;
		align-items: flex-start;
		margin-bottom: 28px;
	}
	.hero-name {
		font-family: var(--font-display);
		font-size: var(--fs-2xl);
		font-weight: 400;
		color: var(--text-strong);
		letter-spacing: -0.02em;
		line-height: 1.05;
	}
	.hero-tag {
		margin-top: 5px;
		font-size: var(--fs-base);
		color: var(--text-muted);
	}
	.hero-chips {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: 12px;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 10px;
		margin-bottom: 28px;
	}
	.detail {
		padding: 12px 14px;
		background: var(--surface);
		border-radius: var(--r-md);
		box-shadow: var(--elev-1);
	}
	.detail-head {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 5px;
	}
	.detail-icon {
		display: inline-flex;
		color: var(--text-subtle);
	}
	.detail-label {
		font-size: 9.5px;
		font-weight: 700;
		color: var(--text-subtle);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.detail-val {
		font-size: var(--fs-sm);
		color: var(--text);
	}

	.section {
		margin-bottom: 28px;
	}
	.section-title {
		font-family: var(--font-display);
		font-size: var(--fs-md);
		font-weight: 400;
		color: var(--text-strong);
		letter-spacing: -0.01em;
		margin-bottom: 14px;
	}
	.notes {
		background: var(--surface);
		border-radius: var(--r-lg);
		padding: 0 20px;
		box-shadow: var(--elev-1);
	}
	.empty {
		font-size: var(--fs-sm);
		color: var(--text-subtle);
		font-style: italic;
	}
</style>
