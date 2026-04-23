<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ThreadView from '$lib/components/ThreadView.svelte';
	import ContextPanel from '$lib/components/ContextPanel.svelte';
	import ProfileView from '$lib/components/ProfileView.svelte';
	import SearchOverlay from '$lib/components/SearchOverlay.svelte';
	import RemindersPanel from '$lib/components/RemindersPanel.svelte';
	import QuickCapture from '$lib/components/QuickCapture.svelte';
	import { onMount } from 'svelte';
	import { CONTACTS } from '$lib/data';

	type Screen = 'thread' | 'profile';

	let activeId = $state('alex');
	let screen = $state<Screen>('thread');
	let searchOpen = $state(false);
	let remindersOpen = $state(false);
	let quickOpen = $state(false);

	let activeContact = $derived(CONTACTS.find((c) => c.id === activeId) ?? null);

	onMount(() => {
		try {
			const saved = localStorage.getItem('crm_activeId');
			if (saved && CONTACTS.some((c) => c.id === saved)) activeId = saved;
		} catch {}

		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				searchOpen = true;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	$effect(() => {
		try {
			localStorage.setItem('crm_activeId', activeId);
		} catch {}
	});

	function selectContact(id: string) {
		activeId = id;
		screen = 'thread';
	}
</script>

<div class="shell">
	<Sidebar
		contacts={CONTACTS}
		{activeId}
		onSelect={selectContact}
		onSearch={() => (searchOpen = true)}
		onReminders={() => (remindersOpen = true)}
	/>

	{#if screen === 'profile' && activeContact}
		<ProfileView contact={activeContact} onBack={() => (screen = 'thread')} />
	{:else}
		<ThreadView
			contact={activeContact}
			onOpenProfile={() => (screen = 'profile')}
			onQuickCapture={() => (quickOpen = true)}
		/>
		<ContextPanel contact={activeContact} onOpenProfile={() => (screen = 'profile')} />
	{/if}
</div>

{#if searchOpen}
	<SearchOverlay
		contacts={CONTACTS}
		onClose={() => (searchOpen = false)}
		onSelect={selectContact}
	/>
{/if}
{#if remindersOpen}
	<RemindersPanel
		contacts={CONTACTS}
		onClose={() => (remindersOpen = false)}
		onSelect={selectContact}
	/>
{/if}
{#if quickOpen}
	<QuickCapture onClose={() => (quickOpen = false)} />
{/if}

<style>
	.shell {
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}
</style>
