<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	type Props = {
		onClose: () => void;
		width?: number;
		align?: 'top' | 'center';
		children: Snippet;
	};
	let { onClose, width = 520, align = 'top', children }: Props = $props();

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div class="scrim" class:center={align === 'center'} onclick={onClose} role="presentation">
	<div
		class="sheet"
		style:--w="{width}px"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		{@render children()}
	</div>
</div>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		background: oklch(24% 0.03 48 / 0.32);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 10vh;
		padding-inline: 20px;
		z-index: 100;
		animation: fade var(--dur-med) var(--ease-out-quart);
	}
	.scrim.center {
		align-items: center;
		padding-top: 0;
	}
	.sheet {
		width: 100%;
		max-width: var(--w);
		background: var(--surface);
		border-radius: var(--r-lg);
		box-shadow: var(--elev-4);
		max-height: min(80vh, 720px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: rise var(--dur-med) var(--ease-out-expo);
	}

	@keyframes fade {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes rise {
		from { opacity: 0; transform: translateY(12px) scale(0.98); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}
</style>
